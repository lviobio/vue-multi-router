import {
  mapMaybePromise,
  MultiRouterHistoryManager,
  type MultiRouterHistoryManagerOptions,
  type HistoryBuilder,
  type MaybePromise,
} from '@/history'
import type { ContextTypes } from '@/types'
import { shallowRef, type App } from 'vue'
import type { Router, RouterHistory } from 'vue-router'

type ContextInterface = {
  type: string
  router: Router
  history: RouterHistory
  initialized: boolean
  historyEnabled: boolean
}

interface ActiveContextInterface {
  key: string
  context: ContextInterface
}

type ContextInitListener = (key: string) => void

type MakeRouterFn = (contextKey: string, history: RouterHistory) => Router

type HistoryManagerOptions = {
  historyBuilder: HistoryBuilder
} & MultiRouterHistoryManagerOptions

export class MultiRouterManagerInstance {
  private started = false
  private activeContext = shallowRef<ActiveContextInterface>()
  private activeHistoryContext = shallowRef<ActiveContextInterface>()
  private registered: Map<string, ContextInterface> = new Map()
  private onContextInitListeners: ContextInitListener[] = []
  private readonly historyManager: MultiRouterHistoryManager

  constructor(
    app: App,
    private types: ContextTypes,
    historyManagerOptions: HistoryManagerOptions,
    private makeRouter: MakeRouterFn,
  ) {
    const { historyBuilder, ...historyOptions } = historyManagerOptions
    this.historyManager = new MultiRouterHistoryManager(historyBuilder, {
      ...historyOptions,
      onContextActivate: (contextKey: string) => {
        // Activate context on popstate (browser back/forward)
        // Use updateHistory=false since we're responding to browser history change
        this.setActive(contextKey, false)
      },
    })
  }

  getHistoryManager() {
    return this.historyManager
  }

  getActiveContext() {
    return this.activeContext.value
  }

  getActiveContextRef() {
    return this.activeContext
  }

  getActiveHistoryContext() {
    return this.activeHistoryContext.value
  }

  getActiveHistoryContextRef() {
    return this.activeHistoryContext
  }

  setActive(key: string, updateHistory: boolean) {
    const item = this.registered.get(key)

    if (!item) throw new Error(`[MultiRouter] Context "${key}" not found`)

    let modified = false

    if (this.activeContext.value?.key !== key) {
      // Push current active context to stack before switching
      if (this.activeContext.value?.key) {
        this.historyManager.pushToContextStack(this.activeContext.value.key)
      }

      // Remove new active context from stack (it shouldn't be there)
      this.historyManager.removeFromContextStack(key)

      this.activeContext.value = {
        key,
        context: item,
      }

      modified = true
    }

    if (updateHistory) {
      // Always save active context to storage (for restoration after reload)
      this.historyManager.saveActiveContext(key)

      // Update browser history and activeHistoryContext only if historyEnabled is true
      if (item.historyEnabled && this.activeHistoryContext.value?.key !== key) {
        this.activeHistoryContext.value = this.activeContext.value
        this.historyManager.setActiveHistoryContext(key)
      }
    }

    if (modified) {
      console.debug('[MultiRouterContextManager] setActive', {
        key,
        updateHistory,
        historyEnabled: item.historyEnabled,
      })
    }

    return modified
  }

  clearHistoryContext(key: string) {
    if (this.activeHistoryContext.value?.key === key) {
      this.historyManager.clearActiveHistoryContext(key)

      const newActiveKey = this.historyManager.getActiveHistoryContextKey()
      if (newActiveKey) {
        const newContext = this.registered.get(newActiveKey)
        if (newContext) {
          this.activeHistoryContext.value = { key: newActiveKey, context: newContext }
        }
      } else {
        this.activeHistoryContext.value = undefined
      }
    }
  }

  markAsStarted() {
    this.started = true
  }

  getRouter(key: string) {
    return this.registered.get(key)!.router
  }

  has(key: string) {
    return this.registered.has(key)
  }

  public register(
    type: string,
    key: string,
    options?: {
      location?: string
      initialLocation?: string
      historyEnabled?: boolean
      default?: boolean
    },
  ): MaybePromise<void> {
    const typeConfig = this.types[type]

    if (!typeConfig) throw new Error(`[MultiRouter] Context type "${type}" not found`)

    const historyEnabled = options?.historyEnabled ?? true
    const isDefault = options?.default ?? false

    const historyResult = this.historyManager.createContextHistory(key, {
      location: options?.location,
      initialLocation: options?.initialLocation,
      historyEnabled,
    })

    return mapMaybePromise(historyResult, (history: RouterHistory) => {
      const router = this.makeRouter(key, history)

      this.registered.set(key, {
        type,
        router,
        history,
        initialized: false,
        historyEnabled,
      })

      router.push(history.location).catch((err) => {
        console.warn('Unexpected error when starting the router:', err)
      })

      router.isReady().then(() => {
        this.markAsStarted()

        // Try to restore activeHistoryContext if this context was the last history context
        mapMaybePromise(
          this.historyManager.tryRestoreActiveHistoryContext(key),
          (restored: boolean) => {
            if (restored && !this.activeHistoryContext.value) {
              console.debug('[MultiRouterContextManager] Restored activeHistoryContext', { key })
              this.activeHistoryContext.value = { key, context: this.registered.get(key)! }
            }
          },
        )

        // Auto-activate if this was the last active context before reload
        // Or activate as default if no saved context exists
        const lastActiveKey = this.historyManager.getLastActiveContextKey()
        mapMaybePromise(lastActiveKey, (resolvedLastActiveKey: string | null) => {
          if (resolvedLastActiveKey === key && !this.activeContext.value) {
            console.debug('[MultiRouterContextManager] Auto-activating last active context', {
              key,
            })
            this.setActive(key, true)
          } else if (!this.activeContext.value) {
            // Check if saved context doesn't exist (was deleted)
            const savedContextExists =
              resolvedLastActiveKey && this.registered.has(resolvedLastActiveKey)

            if (!savedContextExists) {
              // Saved context doesn't exist - activate this one as fallback
              if (isDefault || !resolvedLastActiveKey) {
                console.debug('[MultiRouterContextManager] Activating default context', {
                  key,
                  historyEnabled,
                })
                this.setActive(key, true)
              } else {
                // Try to activate from context stack, or use this context as last resort
                this.activateFromStackOrFallback(key)
              }
            }
          }
        })
      })
    })
  }

  getContextLocation(key: string): string | undefined {
    return this.historyManager.getContextLocation(key)
  }

  getContextHistoryEnabled(key: string): boolean {
    return this.registered.get(key)?.historyEnabled ?? true
  }

  public unregister(key: string) {
    const context = this.registered.get(key)
    if (context) {
      console.debug('[MultiRouterContextManager] unregister', { key })

      // If this was the active context, switch to previous one from the stack
      if (this.activeContext.value?.key === key) {
        this.fallbackToPreviousContext()
      }

      // If this was the active history context, clearHistoryContext will handle the fallback
      if (this.activeHistoryContext.value?.key === key) {
        this.clearHistoryContext(key)
      }

      this.historyManager.removeContextHistory(key)
      this.registered.delete(key)
    }
  }

  private activateFromStackOrFallback(fallbackKey: string) {
    // Already have an active context
    if (this.activeContext.value) return

    // Try to get context from stack
    let contextKey = this.historyManager.popFromContextStack()
    while (contextKey && !this.registered.has(contextKey)) {
      contextKey = this.historyManager.popFromContextStack()
    }

    // Use fallback if stack is empty
    if (!contextKey) {
      contextKey = fallbackKey
    }

    if (contextKey && this.registered.has(contextKey)) {
      console.debug('[MultiRouterContextManager] Activating from stack or fallback', {
        key: contextKey,
      })
      this.setActive(contextKey, true)
    }
  }

  private fallbackToPreviousContext() {
    let previousKey = this.historyManager.popFromContextStack()

    // Find a valid previous context (one that still exists)
    while (previousKey && !this.registered.has(previousKey)) {
      previousKey = this.historyManager.popFromContextStack()
    }

    // If no previous context in stack, try activeHistoryContext
    if (!previousKey) {
      const historyContextKey = this.activeHistoryContext.value?.key
      if (historyContextKey && this.registered.has(historyContextKey)) {
        previousKey = historyContextKey
      }
    }

    // If still no context, pick any registered context
    if (!previousKey && this.registered.size > 0) {
      previousKey = this.registered.keys().next().value ?? null
    }

    if (previousKey) {
      const previousContext = this.registered.get(previousKey)
      if (previousContext) {
        this.activeContext.value = { key: previousKey, context: previousContext }
        this.historyManager.saveActiveContext(previousKey)
        console.debug('[MultiRouterContextManager] fallbackToPreviousContext', { to: previousKey })
        return
      }
    }

    // No previous context found, clear active context
    this.activeContext.value = undefined
    this.historyManager.clearActiveContext()
    console.debug('[MultiRouterContextManager] fallbackToPreviousContext', { to: null })
  }

  public initialize(key: string) {
    this.registered.get(key)!.initialized = true
    this.onContextInitListeners.forEach((fn) => fn(key))
  }

  onContextInit(fn: ContextInitListener) {
    if (this.started) {
      throw new Error('[MultiRouter] adding listener after start is not allowed')
    }

    this.onContextInitListeners.push(fn)
  }
}
