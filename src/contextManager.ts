import {
  type ActivationStrategy,
  type ActivationStrategyFactory,
  immediateActivation,
} from '@/activation-strategies'
import {
  type ContextStorageAdapter,
  isPromise,
  mapMaybePromise,
  MultiRouterHistoryManager,
  type MultiRouterHistoryManagerOptions,
  type MaybePromise,
  SessionStorageAdapter,
} from '@/history'
import { shallowRef, type App } from 'vue'
import type { RouteLocationRaw, Router, RouterHistory } from 'vue-router'

type ContextInterface = {
  type: string
  router: Router
  history: RouterHistory
  initialized: boolean
  historyEnabled: boolean
  keepHistory: boolean
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
  // Parent of each nested context (a MultiRouterContext rendered inside another
  // context's content). Drives fallback-to-parent on close and restore.
  private parentOf: Map<string, string> = new Map()
  // Contexts that render the full route tree (layouts and all) instead of
  // collapsing to the deepest `multiRouterRoot`. Typically the main/shell context.
  private rootContexts: Set<string> = new Set()
  private pendingRegistrations: Map<string, Promise<void>> = new Map()
  private activationSeq = 0
  private onContextInitListeners: ContextInitListener[] = []
  private readonly historyManager: MultiRouterHistoryManager
  private readonly activationStrategy: ActivationStrategy
  // The resolved storage backend (the one passed in, or a SessionStorageAdapter
  // default). Held so it can be retrieved via getStorageAdapter() — letting app
  // code persist its own state through the same backend the router uses.
  private readonly storageAdapter: ContextStorageAdapter
  private defaultContextKey: string | null = null
  private lastRegisteredKey: string | null = null
  // Guard timer for restoring a saved active context that hasn't registered yet
  // (see scheduleRestoreFallback). Debounced: fires once registrations settle.
  private restoreFallbackTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    app: App,
    historyManagerOptions: HistoryManagerOptions,
    private makeRouter: MakeRouterFn,
    activationStrategyFactory?: ActivationStrategyFactory,
  ) {
    const { history, ...historyOptions } = historyManagerOptions
    // Resolve the adapter once here and share the instance with the history
    // layer (same default class as the history layer's own — behavior unchanged).
    this.storageAdapter = historyOptions.storageAdapter ?? new SessionStorageAdapter()
    this.historyManager = new MultiRouterHistoryManager(history, {
      ...historyOptions,
      storageAdapter: this.storageAdapter,
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

  /**
   * The resolved storage backend (the configured adapter, or a default
   * SessionStorageAdapter). Exposed so app code that has the manager — e.g. via
   * `inject(multiRouterContextManagerKey)` or a navigation interceptor — can
   * persist its own state through the same backend (a KeyValueStorageAdapter
   * additionally offers `.namespace(prefix)` for that).
   */
  getStorageAdapter(): ContextStorageAdapter {
    return this.storageAdapter
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

    if (!item) {
      // The context may still be registering through an async storage
      // adapter — defer the activation until registration lands. If another
      // activation is applied in the meantime (e.g. the user clicked into a
      // different context), the deferred one is stale and gets dropped.
      const pending = this.pendingRegistrations.get(key)
      if (pending) {
        console.debug('[MultiRouterContextManager] setActive deferred until registration', { key })
        const seq = this.activationSeq
        pending.then(() => {
          if (this.registered.has(key) && this.activationSeq === seq) {
            this.setActive(key, updateHistory)
          }
        })
        return false
      }

      throw new Error(`[MultiRouter] Context "${key}" not found`)
    }

    let modified = false

    if (this.activeContext.value?.key !== key) {
      this.activationSeq++

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

      // Something became active — the pending restore guard is no longer needed.
      if (this.restoreFallbackTimer !== null) {
        clearTimeout(this.restoreFallbackTimer)
        this.restoreFallbackTimer = null
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
      keepHistory?: boolean
      /** Key of the enclosing context, when this one is nested inside it. */
      parent?: string
      /**
       * Render the full route tree (layouts and all) instead of collapsing to the
       * deepest `multiRouterRoot`. Set on the main/shell context so it shows whole
       * pages, while sub-contexts (panels, drawers) still render only the fragment.
       */
      asRoot?: boolean
    },
  ): MaybePromise<void> {
    // Record the parent linkage eagerly (before any async storage work) so it's
    // available even while registration is still in flight.
    if (options?.parent && options.parent !== key) {
      this.parentOf.set(key, options.parent)
    }
    // Record eagerly too — the view-depth resolver reads it during render.
    if (options?.asRoot) {
      this.rootContexts.add(key)
    } else {
      this.rootContexts.delete(key)
    }

    // With an async storage adapter the same key may be registered again
    // before the first registration resolves (e.g. a quick re-mount) —
    // return the in-flight registration instead of starting a second one
    const pending = this.pendingRegistrations.get(key)
    if (pending) return pending

    const historyEnabled = options?.historyEnabled ?? true
    const isDefault = options?.default ?? false
    const keepHistory = options?.keepHistory ?? false

    const resolvedLocation = options?.location ? this.resolveLocation(options.location) : undefined
    const resolvedInitialLocation = options?.initialLocation
      ? this.resolveLocation(options.initialLocation)
      : undefined

    const historyResult = this.historyManager.createContextHistory(key, {
      location: resolvedLocation,
      initialLocation: resolvedInitialLocation,
      historyEnabled,
    })

    const result = mapMaybePromise(historyResult, (history: RouterHistory) => {
      const router = this.makeRouter(key, history)

      this.registered.set(key, {
        type,
        router,
        history,
        initialized: false,
        historyEnabled,
        keepHistory,
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

    if (isPromise(result)) {
      this.pendingRegistrations.set(key, result)
      result.finally(() => this.pendingRegistrations.delete(key))
    }

    return result
  }

  getContextLocation(key: string): string | undefined {
    return this.historyManager.getContextLocation(key)
  }

  getContextHistoryEnabled(key: string): boolean {
    return this.registered.get(key)?.historyEnabled ?? true
  }

  public unregister(key: string) {
    const context = this.registered.get(key)
    if (!context) return

    console.debug('[MultiRouterContextManager] unregister', { key })

    this.activationStrategy.onContextRemoved(key)

    const wasActive = this.activeContext.value?.key === key
    const wasHistoryActive = this.activeHistoryContext.value?.key === key
    // The parent is used as a *secondary* fallback: the previously-active stack
    // wins (so sibling contexts fall back to each other), but when that stack is
    // exhausted — e.g. after a reload, where it may not contain the parent — a
    // closed nested context hands activation back to its parent instead of the
    // app default, keeping the enclosing context on screen.
    const parentHint = this.parentOf.get(key) ?? undefined

    // With keepHistory the persisted stack survives and is restored on re-register.
    this.historyManager.removeContextHistory(key, context.keepHistory, parentHint)
    this.registered.delete(key)
    this.parentOf.delete(key)
    this.rootContexts.delete(key)

    if (wasActive) {
      this.fallbackToPreviousContext(parentHint)
    }
    if (wasHistoryActive) {
      this.clearHistoryContext(key)
    }
  }

  /** Whether `key` renders the full route tree instead of collapsing to multiRouterRoot. */
  rendersAsRoot(key: string): boolean {
    return this.rootContexts.has(key)
  }

  /** Key of the context that encloses `key`, or null if it isn't nested. */
  getParent(key: string): string | null {
    return this.parentOf.get(key) ?? null
  }

  /**
   * Original per-context activation logic (used by ImmediateActivationStrategy).
   * Tries to activate the context immediately based on saved state or default flag.
   */
  private tryImmediateActivation(key: string, isDefault: boolean) {
    // With an async storage adapter other contexts may still be registering.
    // Whether the saved active context "exists" depends on them — deciding
    // now would let a default context steal the activation (and the browser
    // URL) from the saved one. Re-evaluate once all in-flight registrations
    // settle; the recursion re-checks in case new ones appeared meanwhile.
    if (this.pendingRegistrations.size > 0) {
      Promise.all(this.pendingRegistrations.values()).then(() =>
        this.tryImmediateActivation(key, isDefault),
      )
      return
    }

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
          if (resolvedLastActiveKey) {
            // A saved active context exists in storage but hasn't registered yet
            // — on reload it may still be mounting (e.g. a nested context whose
            // parent renders it after starting up). Letting the default/this
            // context grab activation now would push a browser history entry,
            // then the saved context would re-activate with the matching URL (a
            // replace) — churning history and breaking back/forward. Defer: the
            // saved context self-activates when it registers (the branch above),
            // or this guard falls back if it genuinely never does.
            this.scheduleRestoreFallback()
          } else if (isDefault) {
            // Fresh start (no saved active context) — activate the default now.
            console.debug('[MultiRouterContextManager] Activating default context', {
              key,
            })
            this.setActive(key, true)
          } else {
            // Fresh start, and this is a NON-default context. Don't let it grab
            // activation just because it became ready first — that would, e.g.,
            // auto-open an app drawer pointed at its initial-location on a deep
            // link. Defer so the default context wins; the guard falls back to
            // the best available context if there is no default.
            this.scheduleRestoreFallback()
          }
        }
      }
    })
  }

  /**
   * Restoring a saved active context that hasn't registered yet: wait a beat for
   * it (debounced — reset on each pending registration so it fires only once
   * registrations settle). The saved context normally self-activates on
   * registration before this runs; if it never registers (stale state), pick the
   * best available context. Keeps reloads churn-free without the consumer having
   * to opt into the stabilization activation strategy.
   */
  private scheduleRestoreFallback() {
    if (this.restoreFallbackTimer !== null) {
      clearTimeout(this.restoreFallbackTimer)
    }
    this.restoreFallbackTimer = setTimeout(() => {
      this.restoreFallbackTimer = null
      this.resolveActivation()
    }, 50)
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

  private fallbackToPreviousContext(parentHint?: string) {
    let previousKey = this.historyManager.popFromContextStack()

    // Find a valid previous context (one that still exists)
    while (previousKey && !this.registered.has(previousKey)) {
      previousKey = this.historyManager.popFromContextStack()
    }

    // Secondary: a closed nested context hands activation to its parent when the
    // previous-active stack is exhausted (e.g. after a reload).
    if (!previousKey && parentHint && this.registered.has(parentHint)) {
      previousKey = parentHint
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
