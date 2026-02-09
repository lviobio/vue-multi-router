import {
  type ActivationStrategy,
  type ActivationStrategyFactory,
  immediateActivation,
} from '@/activation-strategies'
import {
  mapMaybePromise,
  MultiRouterHistoryManager,
  type MultiRouterHistoryManagerOptions,
  type MaybePromise,
} from '@/history'
import { shallowRef, type App } from 'vue'
import type { RouteLocationRaw, Router, RouterHistory } from 'vue-router'

type ContextInterface = {
  type: string
  router: Router
  history: RouterHistory
  initialized: boolean
  historyEnabled: boolean
}

export interface ActiveContextInterface {
  key: string
  data: ContextInterface
}

type ContextInitListener = (key: string) => void

type MakeRouterFn = (contextKey: string, history: RouterHistory) => Router

type HistoryManagerOptions = {
  history: RouterHistory
} & MultiRouterHistoryManagerOptions

export class MultiRouterManagerInstance {
  private started = false
  private activeContext = shallowRef<ActiveContextInterface>()
  private activeHistoryContext = shallowRef<ActiveContextInterface>()
  private registered: Map<string, ContextInterface> = new Map()
  private onContextInitListeners: ContextInitListener[] = []
  private readonly historyManager: MultiRouterHistoryManager
  private readonly activationStrategy: ActivationStrategy
  private defaultContextKey: string | null = null
  private lastRegisteredKey: string | null = null

  constructor(
    app: App,
    historyManagerOptions: HistoryManagerOptions,
    private makeRouter: MakeRouterFn,
    activationStrategyFactory?: ActivationStrategyFactory,
  ) {
    const { history, ...historyOptions } = historyManagerOptions
    this.historyManager = new MultiRouterHistoryManager(history, {
      ...historyOptions,
      onContextActivate: (contextKey: string) => {
        // Activate context on popstate (browser back/forward)
        // Use updateHistory=false since we're responding to browser history change
        this.setActive(contextKey, false)

        // Also update activeHistoryContext (but don't push to browser history)
        const context = this.registered.get(contextKey)
        if (context?.historyEnabled && this.activeHistoryContext.value?.key !== contextKey) {
          this.activeHistoryContext.value = { key: contextKey, data: context }
        }
      },
    })

    const factory = activationStrategyFactory ?? immediateActivation()
    this.activationStrategy = factory({
      resolveActivation: () => this.resolveActivation(),
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
        data: item,
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
          this.activeHistoryContext.value = { key: newActiveKey, data: newContext }
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

  /**
   * Resolves a route location (string or named route object) to a path string.
   * Uses any already-registered context router for resolution (they all share
   * the same route configuration). This avoids the need for a separate
   * resolver router and correctly handles routes added at runtime.
   */
  resolveLocation(location: RouteLocationRaw): string {
    if (typeof location === 'string') return location

    const router = this.getAnyRouter()
    if (!router) {
      throw new Error(
        '[MultiRouter] Cannot resolve RouteLocationRaw: no context routers registered yet. ' +
          'Use a string path for the first context, or register at least one context before ' +
          'using named route objects.',
      )
    }

    return router.resolve(location).fullPath
  }

  /**
   * Returns any registered router (they all share the same route config).
   */
  private getAnyRouter(): Router | null {
    const first = this.registered.values().next()
    return first.done ? null : first.value.router
  }

  public register(
    type: string,
    key: string,
    options?: {
      location?: string | RouteLocationRaw
      initialLocation?: string | RouteLocationRaw
      historyEnabled?: boolean
      default?: boolean
    },
  ): MaybePromise<void> {
    const historyEnabled = options?.historyEnabled ?? true
    const isDefault = options?.default ?? false

    const resolvedLocation = options?.location ? this.resolveLocation(options.location) : undefined
    const resolvedInitialLocation = options?.initialLocation
      ? this.resolveLocation(options.initialLocation)
      : undefined

    const historyResult = this.historyManager.createContextHistory(key, {
      location: resolvedLocation,
      initialLocation: resolvedInitialLocation,
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
        this.lastRegisteredKey = key

        if (isDefault) {
          this.defaultContextKey = key
        }

        // Try to restore activeHistoryContext if this context was the last history context
        mapMaybePromise(
          this.historyManager.tryRestoreActiveHistoryContext(key),
          (restored: boolean) => {
            if (restored && !this.activeHistoryContext.value) {
              console.debug('[MultiRouterContextManager] Restored activeHistoryContext', { key })
              this.activeHistoryContext.value = { key, data: this.registered.get(key)! }
            }
          },
        )

        // Delegate activation decision to the strategy
        const shouldActivateImmediately = this.activationStrategy.onContextReady(key)

        if (shouldActivateImmediately) {
          this.tryImmediateActivation(key, isDefault)
        }
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

      this.activationStrategy.onContextRemoved(key)

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

  /**
   * Original per-context activation logic (used by ImmediateActivationStrategy).
   * Tries to activate the context immediately based on saved state or default flag.
   */
  private tryImmediateActivation(key: string, isDefault: boolean) {
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
            })
            this.setActive(key, true)
          } else {
            // Try to activate from context stack, or use this context as last resort
            this.activateFromStackOrFallback(key)
          }
        }
      }
    })
  }

  /**
   * Deferred activation logic (used by StabilizationActivationStrategy).
   * Called once when the strategy decides all contexts have been registered.
   * Picks the best context to activate using the following priority:
   *
   * 1. Previously-saved context from storage (if it now exists in registered map).
   * 2. Context marked with `default: true`.
   * 3. Last registered context.
   * 4. Any registered context.
   */
  private resolveActivation() {
    if (this.activeContext.value) return // already activated (e.g. via manual setActive)

    const lastActiveKey = this.historyManager.getLastActiveContextKey()
    mapMaybePromise(lastActiveKey, (resolvedLastActiveKey: string | null) => {
      if (this.activeContext.value) return // re-check after potential async

      // 1. Try to restore the saved context
      if (resolvedLastActiveKey && this.registered.has(resolvedLastActiveKey)) {
        console.debug('[MultiRouterContextManager] resolveActivation: restoring saved context', {
          key: resolvedLastActiveKey,
        })
        this.setActive(resolvedLastActiveKey, true)
        return
      }

      // 2. Try the default context
      if (this.defaultContextKey && this.registered.has(this.defaultContextKey)) {
        console.debug('[MultiRouterContextManager] resolveActivation: activating default context', {
          key: this.defaultContextKey,
        })
        this.setActive(this.defaultContextKey, true)
        return
      }

      // 3. Try the last registered context
      if (this.lastRegisteredKey && this.registered.has(this.lastRegisteredKey)) {
        console.debug(
          '[MultiRouterContextManager] resolveActivation: activating last registered context',
          { key: this.lastRegisteredKey },
        )
        this.setActive(this.lastRegisteredKey, true)
        return
      }

      // 4. Any registered context
      if (this.registered.size > 0) {
        const firstKey = this.registered.keys().next().value
        if (firstKey) {
          console.debug(
            '[MultiRouterContextManager] resolveActivation: activating first available context',
            { key: firstKey },
          )
          this.setActive(firstKey, true)
        }
      }
    })
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
        this.activeContext.value = { key: previousKey, data: previousContext }
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
