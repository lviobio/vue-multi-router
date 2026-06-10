import type { RouterHistory } from 'vue-router'
import {
  flatMapMaybePromise,
  mapMaybePromise,
  type ContextStorageAdapter,
  type MaybePromise,
} from './storage/index'
import {
  NavigationDirection,
  NavigationType,
  type HistoryLocation,
  type HistoryState,
  type NavigationCallback,
  type NavigationInformation,
  type VirtualStack,
} from './types'
import { VirtualStackManager } from './virtual-stack'

class ContextHistoryProxy implements RouterHistory {
  constructor(
    private contextKey: string,
    private manager: MultiRouterHistoryManager,
  ) {}

  get base(): string {
    return this.manager.base
  }

  get location(): HistoryLocation {
    return this.manager.getContextLocation(this.contextKey)
  }

  get state(): HistoryState {
    return this.manager.getContextState(this.contextKey)
  }

  push(to: HistoryLocation, data?: HistoryState): void {
    this.manager.push(this.contextKey, to, data)
  }

  replace(to: HistoryLocation, data?: HistoryState): void {
    this.manager.replace(this.contextKey, to, data)
  }

  go(delta: number, triggerListeners?: boolean): void {
    this.manager.go(this.contextKey, delta, triggerListeners)
  }

  listen(callback: NavigationCallback): () => void {
    return this.manager.listen(this.contextKey, callback)
  }

  createHref(location: HistoryLocation): string {
    return this.manager.createHref(location)
  }

  destroy(): void {
    this.manager.removeContextHistory(this.contextKey)
  }
}

const CONTEXT_KEY_STATE = '__multiRouterContext'
const STACK_INDEX_STATE = '__multiRouterStackIndex'
const POSITIONS_STATE = '__multiRouterPositions'

/**
 * Defines how the browser URL is updated when switching between contexts.
 *
 * - `'none'`: URL is not updated when switching contexts. URL changes only on push/replace.
 *   This gives precise back/forward navigation matching the number of push operations.
 *
 * - `'replace'`: URL is updated using history.replace(). This changes the URL immediately
 *   but overwrites the current history entry's state. May cause issues with forward navigation
 *   if the previous context had unsaved state.
 *
 * - `'push'`: URL is updated using history.push() when the new context's URL differs from current.
 *   This preserves all history entries but adds extra back steps when switching between
 *   contexts with different URLs.
 */
export type ContextSwitchMode = 'none' | 'replace' | 'push'

export interface MultiRouterHistoryManagerOptions {
  /**
   * Adapter for persisting context history state.
   * @default SessionStorageAdapter
   */
  storageAdapter?: ContextStorageAdapter
  /**
   * How to update browser URL when switching contexts.
   * @default 'replace'
   */
  contextSwitchMode?: ContextSwitchMode
  /**
   * Callback called when a popstate event requires activating a different context.
   * This happens when navigating back/forward to a history entry owned by another context.
   */
  onContextActivate?: (contextKey: string) => void
}

export class MultiRouterHistoryManager {
  private history: RouterHistory
  private stacks: VirtualStackManager
  private activeHistoryContextKey: string | null = null
  private historyContextStack: string[] = []
  private contextStack: string[] = []
  private baseHistoryCleanup: (() => void) | null = null
  private contextSwitchMode: ContextSwitchMode
  private onContextActivate?: (contextKey: string) => void

  constructor(history: RouterHistory, options?: MultiRouterHistoryManagerOptions) {
    this.history = history
    this.stacks = new VirtualStackManager(options?.storageAdapter)
    this.contextSwitchMode = options?.contextSwitchMode ?? 'replace'
    this.onContextActivate = options?.onContextActivate
    this.baseHistoryCleanup = this.history.listen(this.handlePopState.bind(this))

    // Restore context stacks from storage
    this.restoreContextStacks()
  }

  private restoreContextStacks(): void {
    mapMaybePromise(this.stacks.getContextStack(), (stack) => {
      this.contextStack = stack
    })
    mapMaybePromise(this.stacks.getHistoryContextStack(), (stack) => {
      this.historyContextStack = stack
    })
  }

  get base() {
    return this.history.base
  }

  get location(): HistoryLocation {
    return this.history.location
  }

  get state(): HistoryState {
    return this.history.state
  }

  createContextHistory(
    contextKey: string,
    options?: { location?: string; initialLocation?: string; historyEnabled?: boolean },
  ): MaybePromise<RouterHistory> {
    if (this.stacks.has(contextKey)) {
      return new ContextHistoryProxy(contextKey, this)
    }

    const { location, initialLocation, historyEnabled = true } = options ?? {}

    // Get last active context (may be sync or async)
    return flatMapMaybePromise(this.stacks.getStoredActiveContext(), (lastActiveContext) => {
      const isLastActive = lastActiveContext === contextKey

      if (location) {
        // Explicit location always has priority - force this URL
        const virtualStack = this.createInitialVirtualStack(location)
        console.debug('[MultiRouterHistory] Created context with forced location', {
          contextKey,
          location,
        })
        return this.finalizeContextCreation(contextKey, virtualStack, isLastActive, historyEnabled)
      }

      // No forced location - try to restore from storage
      return mapMaybePromise(this.stacks.restore(contextKey), (restoredStack) => {
        let virtualStack: VirtualStack

        if (restoredStack) {
          // Storage has priority over initialLocation
          // Only update from browser URL if historyEnabled (browser URL belongs to this context)
          if (isLastActive && historyEnabled) {
            // Update current position with browser URL (user may have changed it)
            const browserUrl = this.history.location
            restoredStack.entries[restoredStack.position] = {
              location: browserUrl,
              state: this.history.state ?? {},
            }
            console.debug('[MultiRouterHistory] Restored from storage with browser URL', {
              contextKey,
              browserUrl,
            })
          } else {
            console.debug('[MultiRouterHistory] Restored from storage', {
              contextKey,
              historyEnabled,
            })
          }
          virtualStack = restoredStack
        } else if (isLastActive && historyEnabled) {
          // No storage, but was last active with historyEnabled - use browser URL
          const browserUrl = this.history.location
          virtualStack = this.createInitialVirtualStack(browserUrl)
          console.debug('[MultiRouterHistory] Created with browser URL (last active)', {
            contextKey,
            browserUrl,
          })
        } else if (initialLocation) {
          // Use initialLocation as fallback
          virtualStack = this.createInitialVirtualStack(initialLocation)
          console.debug('[MultiRouterHistory] Created with initialLocation', {
            contextKey,
            initialLocation,
          })
        } else {
          // No storage, not last active, no initialLocation - use browser URL
          // This handles fresh start with empty storage
          const browserUrl = this.history.location
          virtualStack = this.createInitialVirtualStack(browserUrl)
          console.debug('[MultiRouterHistory] Created with browser URL (fresh start)', {
            contextKey,
            browserUrl,
          })
        }

        return this.finalizeContextCreation(contextKey, virtualStack, isLastActive, historyEnabled)
      })
    })
  }

  private finalizeContextCreation(
    contextKey: string,
    virtualStack: VirtualStack,
    isLastActive: boolean,
    historyEnabled: boolean,
  ): RouterHistory {
    this.stacks.create(contextKey, virtualStack, historyEnabled)

    // If this context was the last active, restore its active state
    // But only set as activeHistoryContext if historyEnabled is true
    if (isLastActive && historyEnabled) {
      this.activeHistoryContextKey = contextKey
      this.restoreUrlFromVirtualStack(contextKey)
    }

    return new ContextHistoryProxy(contextKey, this)
  }

  tryRestoreActiveHistoryContext(contextKey: string): MaybePromise<boolean> {
    // Try to restore activeHistoryContext from storage if this context matches
    // Only restore if historyEnabled is true - contexts with historyEnabled=false cannot be activeHistoryContext
    return mapMaybePromise(this.stacks.getStoredActiveHistoryContext(), (storedKey) => {
      if (
        storedKey === contextKey &&
        this.stacks.has(contextKey) &&
        this.stacks.isHistoryEnabled(contextKey)
      ) {
        this.activeHistoryContextKey = contextKey
        this.restoreUrlFromVirtualStack(contextKey)
        return true
      }
      return false
    })
  }

  /**
   * Remove a context's runtime history state.
   * With `keepStorage` the persisted virtual stack survives, so a later
   * registration of the same context restores it (see the `keepHistory`
   * option of MultiRouterContext).
   */
  removeContextHistory(
    contextKey: string,
    keepStorage: boolean = false,
    parentHint?: string,
  ): void {
    this.stacks.remove(contextKey, keepStorage)

    if (this.activeHistoryContextKey === contextKey) {
      this.fallbackToPreviousHistoryContext(parentHint)
    }

    // Remove from both stacks
    this.historyContextStack = this.historyContextStack.filter((k) => k !== contextKey)
    this.stacks.saveHistoryContextStack(this.historyContextStack)

    this.contextStack = this.contextStack.filter((k) => k !== contextKey)
    this.stacks.saveContextStack(this.contextStack)
  }

  /**
   * Purge a context's persisted virtual stack from storage. Use after a
   * `keepHistory` context is *intentionally* closed (not merely unmounted by a
   * reload): keepHistory deliberately leaves the stored stack behind on
   * unregister so a reload can restore it, which orphans it on a real close.
   */
  clearStoredContextHistory(contextKey: string): void {
    this.stacks.clearStoredStack(contextKey)
  }

  setActiveHistoryContext(contextKey: string): void {
    if (!this.stacks.has(contextKey)) {
      throw new Error(`[MultiRouterHistory] Context "${contextKey}" not registered`)
    }

    if (this.activeHistoryContextKey === contextKey) {
      return
    }

    const previousKey = this.activeHistoryContextKey

    if (previousKey) {
      this.historyContextStack = this.historyContextStack.filter((k) => k !== previousKey)
      this.historyContextStack.push(previousKey)
    }

    // Remove new active context from stack (it shouldn't be there)
    this.historyContextStack = this.historyContextStack.filter((k) => k !== contextKey)
    this.stacks.saveHistoryContextStack(this.historyContextStack)

    this.activeHistoryContextKey = contextKey
    this.stacks.saveActiveContext(contextKey)
    this.stacks.saveActiveHistoryContext(contextKey)

    // Update browser URL to show the new context's current location
    // Use replace to change URL without adding a new history entry
    this.restoreUrlFromVirtualStack(contextKey)

    console.debug('[MultiRouterHistory] setActiveHistoryContext', {
      from: previousKey,
      to: contextKey,
    })
  }

  /**
   * Make a context the active history context without syncing the browser URL.
   * Used on popstate: the browser already shows the entry owned by the context,
   * so only the ownership bookkeeping has to follow. Otherwise the manager keeps
   * attributing the URL to the previous context and a later
   * setActiveHistoryContext() back to it becomes a no-op, leaving a stale URL.
   */
  private adoptActiveHistoryContext(contextKey: string): void {
    if (this.activeHistoryContextKey === contextKey) {
      return
    }

    if (!this.stacks.isHistoryEnabled(contextKey)) {
      return
    }

    const previousKey = this.activeHistoryContextKey

    if (previousKey) {
      this.historyContextStack = this.historyContextStack.filter((k) => k !== previousKey)
      this.historyContextStack.push(previousKey)
    }

    // Remove new active context from stack (it shouldn't be there)
    this.historyContextStack = this.historyContextStack.filter((k) => k !== contextKey)
    this.stacks.saveHistoryContextStack(this.historyContextStack)

    this.activeHistoryContextKey = contextKey
    this.stacks.saveActiveContext(contextKey)
    this.stacks.saveActiveHistoryContext(contextKey)

    console.debug('[MultiRouterHistory] adoptActiveHistoryContext', {
      from: previousKey,
      to: contextKey,
    })
  }

  clearActiveHistoryContext(contextKey: string): void {
    if (this.activeHistoryContextKey !== contextKey) {
      return
    }

    this.fallbackToPreviousHistoryContext()
  }

  saveActiveContext(contextKey: string): void {
    this.stacks.saveActiveContext(contextKey)
  }

  /**
   * Push the current active context to the context stack before switching to a new one.
   * This allows fallback to the previous context when the current one is removed.
   */
  pushToContextStack(contextKey: string): void {
    // Remove if already in stack to avoid duplicates
    this.contextStack = this.contextStack.filter((k) => k !== contextKey)
    this.contextStack.push(contextKey)
    this.stacks.saveContextStack(this.contextStack)
  }

  /**
   * Get the previous context from the stack (for fallback when current context is removed).
   * Returns null if no previous context exists.
   */
  popFromContextStack(): string | null {
    const previousKey = this.contextStack.pop() ?? null
    this.stacks.saveContextStack(this.contextStack)
    return previousKey
  }

  /**
   * Remove a context from the context stack (when the context is unregistered).
   */
  removeFromContextStack(contextKey: string): void {
    this.contextStack = this.contextStack.filter((k) => k !== contextKey)
    this.stacks.saveContextStack(this.contextStack)
  }

  /**
   * Clear the active context from storage (when no contexts are left).
   */
  clearActiveContext(): void {
    this.stacks.clearActiveContext()
  }

  getActiveHistoryContextKey(): string | null {
    return this.activeHistoryContextKey
  }

  private fallbackToPreviousHistoryContext(parentHint?: string): void {
    let previousKey = this.historyContextStack.pop()

    // Find a valid previous context (one that still exists)
    while (previousKey && !this.stacks.has(previousKey)) {
      previousKey = this.historyContextStack.pop()
    }

    // Secondary: when the previous-active stack is exhausted (e.g. after a
    // reload), a closed nested context hands ownership to its parent rather than
    // an arbitrary history-enabled context.
    if (
      !previousKey &&
      parentHint &&
      this.stacks.has(parentHint) &&
      this.stacks.isHistoryEnabled(parentHint)
    ) {
      previousKey = parentHint
    }

    // If no previous context in stack, pick any registered context with historyEnabled
    if (!previousKey) {
      for (const [key, context] of this.stacks.entries()) {
        if (context.historyEnabled) {
          previousKey = key
          break
        }
      }
    }

    if (previousKey && this.stacks.has(previousKey)) {
      this.activeHistoryContextKey = previousKey
      this.stacks.saveActiveHistoryContext(previousKey)

      // Sync the browser URL to the new owner's location (mirrors setActiveHistoryContext).
      // Otherwise the URL keeps pointing at the removed context's route and gets
      // adopted into the last active context's stack after a reload.
      this.restoreUrlFromVirtualStack(previousKey)
    } else {
      this.activeHistoryContextKey = null
      this.stacks.clearActiveHistoryContext()
    }

    this.stacks.saveHistoryContextStack(this.historyContextStack)

    console.debug('[MultiRouterHistory] fallbackToPreviousHistoryContext', {
      to: this.activeHistoryContextKey,
    })
  }

  private createInitialVirtualStack(initialLocation?: string): VirtualStack {
    const location = initialLocation ?? '/'
    return {
      entries: [{ location, state: {} }],
      position: 0,
    }
  }

  /**
   * Snapshot of every history-enabled context's virtual stack position.
   * Stored in each browser history entry's state so that popstate can restore
   * ALL contexts to where they were at that moment — not just the entry's
   * owner. Without it, entries evicted from the shared browser timeline (e.g.
   * by a `replace`-mode context switch) leave their context stranded: nothing
   * in the timeline points at its newer positions anymore, so forward replay
   * skips them (panel keeps an empty input after back+forward).
   */
  private capturePositionsSnapshot(): Record<string, number> {
    const positions: Record<string, number> = {}
    for (const [key, context] of this.stacks.entries()) {
      if (context.historyEnabled) {
        positions[key] = context.virtualStack.position
      }
    }
    return positions
  }

  /**
   * Reposition every history-enabled context to the snapshot recorded in the
   * target history entry. The owner context is excluded — the regular popstate
   * flow handles it (with activation and ensureEntriesUpTo).
   */
  private applyPositionsSnapshot(
    snapshot: Record<string, number>,
    ownerContextKey: string,
    info: NavigationInformation,
  ): void {
    for (const [key, position] of Object.entries(snapshot)) {
      if (key === ownerContextKey) continue

      const context = this.stacks.get(key)
      if (!context || !context.historyEnabled) continue

      const currentPosition = context.virtualStack.position
      if (
        position === currentPosition ||
        position < 0 ||
        position >= context.virtualStack.entries.length
      ) {
        continue
      }

      const from = context.virtualStack.entries[currentPosition]?.location
      this.stacks.setPosition(key, position)
      const to = context.virtualStack.entries[position]?.location

      console.debug('[MultiRouterHistory] popstate snapshot reposition', {
        contextKey: key,
        from: currentPosition,
        to: position,
      })

      if (to && from && to !== from) {
        this.stacks.notifyListeners(key, to, from, info)
      }
    }
  }

  private restoreUrlFromVirtualStack(contextKey: string): void {
    if (this.contextSwitchMode === 'none') {
      return
    }

    const context = this.stacks.get(contextKey)
    if (!context) return

    const entry = context.virtualStack.entries[context.virtualStack.position]
    if (!entry) return

    const state = {
      ...entry.state,
      [CONTEXT_KEY_STATE]: contextKey,
      [STACK_INDEX_STATE]: context.virtualStack.position,
      [POSITIONS_STATE]: this.capturePositionsSnapshot(),
    }

    if (this.contextSwitchMode === 'push') {
      // Push if URL is different, replace if same
      if (entry.location !== this.history.location) {
        this.history.push(entry.location, state)
      } else {
        this.history.replace(entry.location, state)
      }
    } else {
      // 'replace' mode - always replace
      this.history.replace(entry.location, state)
    }
  }

  private handlePopState(
    to: HistoryLocation,
    from: HistoryLocation,
    info: NavigationInformation,
  ): void {
    const stateContextKey = this.history.state?.[CONTEXT_KEY_STATE] as string | undefined
    const stateStackIndex = this.history.state?.[STACK_INDEX_STATE] as number | undefined
    const statePositions = this.history.state?.[POSITIONS_STATE] as
      | Record<string, number>
      | undefined

    console.debug('[MultiRouterHistory] popstate raw', {
      stateContextKey,
      stateStackIndex,
      browserTo: to,
      browserFrom: from,
      delta: info.delta,
      virtualStacks: Object.fromEntries(
        Array.from(this.stacks.entries()).map(([k, v]) => [
          k,
          {
            position: v.virtualStack.position,
            entries: v.virtualStack.entries.map((e) => e.location),
          },
        ]),
      ),
    })

    let ownerContextKey: string | null = null
    let targetStackIndex: number | null = null

    // The state contains the TARGET context and stack index
    // This is the context we're navigating TO, not FROM
    if (stateContextKey && this.stacks.has(stateContextKey)) {
      ownerContextKey = stateContextKey
      targetStackIndex = stateStackIndex ?? null
    }

    // Fallback to active context if state doesn't have context info
    if (!ownerContextKey) {
      ownerContextKey = this.activeHistoryContextKey
    }

    if (!ownerContextKey) return

    // Restore every other context to its recorded position first, so the
    // whole app reflects the historical state of this entry — not only the
    // context that owns it
    if (statePositions) {
      this.applyPositionsSnapshot(statePositions, ownerContextKey, info)
    }

    const context = this.stacks.get(ownerContextKey)!

    let newPosition: number
    if (targetStackIndex !== null) {
      newPosition = targetStackIndex
    } else {
      newPosition = context.virtualStack.position + info.delta
    }

    // Ensure virtual stack has enough entries
    this.stacks.ensureEntriesUpTo(ownerContextKey, newPosition, to)

    if (newPosition >= 0 && newPosition < context.virtualStack.entries.length) {
      // The browser entry records its owner's location at this stack index.
      // If the virtual entry disagrees (e.g. it was backfilled after the
      // persisted stack was reset), the browser URL is authoritative.
      this.stacks.syncEntryLocation(ownerContextKey, newPosition, to)

      const previousLocation =
        context.virtualStack.entries[context.virtualStack.position]?.location ?? from
      this.stacks.setPosition(ownerContextKey, newPosition)

      const targetLocation = context.virtualStack.entries[newPosition]?.location ?? to

      console.debug('[MultiRouterHistory] popstate result', {
        ownerContext: ownerContextKey,
        activeContext: this.activeHistoryContextKey,
        browserUrl: to,
        contextUrl: targetLocation,
        targetStackIndex: newPosition,
        previousLocation,
        delta: info.delta,
      })

      // The browser URL now shows this entry, so its owner takes over as the
      // active history context (without touching the URL)
      this.adoptActiveHistoryContext(ownerContextKey)

      // Activate the context that owns this history entry
      if (this.onContextActivate) {
        this.onContextActivate(ownerContextKey)
      }

      this.stacks.notifyListeners(ownerContextKey, targetLocation, previousLocation, info)
    }
  }

  /**
   * A background context navigated while another context owns the current
   * browser entry. Refresh that entry's positions snapshot so navigating back
   * to it restores every context to the state the user left it in — not the
   * state it had when the entry was created.
   */
  private refreshCurrentEntryPositions(): void {
    const state = this.history.state
    if (!state || state[CONTEXT_KEY_STATE] === undefined) {
      return
    }

    // Skip the replaceState call when nothing moved — a background replace()
    // keeps positions intact, and this runs on a hot path (e.g. every
    // keystroke synced to an inactive context's query)
    const positions = this.capturePositionsSnapshot()
    const stored = state[POSITIONS_STATE] as Record<string, number> | undefined
    const keys = Object.keys(positions)
    if (
      stored &&
      keys.length === Object.keys(stored).length &&
      keys.every((key) => stored[key] === positions[key])
    ) {
      return
    }

    this.history.replace(this.history.location, {
      ...state,
      [POSITIONS_STATE]: positions,
    })
  }

  push(contextKey: string, to: HistoryLocation, data?: HistoryState): void {
    const stackIndex = this.stacks.push(contextKey, to, data ?? {})
    const historyEnabled = this.stacks.isHistoryEnabled(contextKey)

    // Only update browser history if context is active AND historyEnabled
    if (this.activeHistoryContextKey === contextKey && historyEnabled) {
      this.history.push(to, {
        ...data,
        [CONTEXT_KEY_STATE]: contextKey,
        [STACK_INDEX_STATE]: stackIndex,
        [POSITIONS_STATE]: this.capturePositionsSnapshot(),
      })
    } else {
      this.refreshCurrentEntryPositions()
    }

    console.debug('[MultiRouterHistory] push', {
      contextKey,
      to,
      stackIndex,
      isActive: this.activeHistoryContextKey === contextKey,
      historyEnabled,
    })
  }

  replace(contextKey: string, to: HistoryLocation, data?: HistoryState): void {
    const stackIndex = this.stacks.replace(contextKey, to, data ?? {})
    const historyEnabled = this.stacks.isHistoryEnabled(contextKey)

    // Only update browser history if context is active AND historyEnabled
    if (this.activeHistoryContextKey === contextKey && historyEnabled) {
      this.history.replace(to, {
        ...data,
        [CONTEXT_KEY_STATE]: contextKey,
        [STACK_INDEX_STATE]: stackIndex,
        [POSITIONS_STATE]: this.capturePositionsSnapshot(),
      })
    } else {
      this.refreshCurrentEntryPositions()
    }

    console.debug('[MultiRouterHistory] replace', {
      contextKey,
      to,
      stackIndex,
      isActive: this.activeHistoryContextKey === contextKey,
      historyEnabled,
    })
  }

  go(contextKey: string, delta: number, triggerListeners = true): void {
    if (!this.stacks.has(contextKey)) {
      throw new Error(`[MultiRouterHistory] Context "${contextKey}" not registered`)
    }

    if (this.activeHistoryContextKey === contextKey) {
      this.history.go(delta, triggerListeners)
    } else {
      const result = this.stacks.navigate(contextKey, delta)
      if (result && triggerListeners) {
        this.stacks.notifyListeners(contextKey, result.to, result.from, {
          type: NavigationType.pop,
          direction: delta < 0 ? NavigationDirection.back : NavigationDirection.forward,
          delta,
        })
      }
    }
  }

  listen(contextKey: string, callback: NavigationCallback): () => void {
    return this.stacks.addListener(contextKey, callback)
  }

  getContextLocation(contextKey: string): HistoryLocation {
    return this.stacks.getLocation(contextKey, this.history.location)
  }

  getContextState(contextKey: string): HistoryState {
    return this.stacks.getState(contextKey)
  }

  createHref(location: HistoryLocation): string {
    return this.history.createHref(location)
  }

  destroy(): void {
    if (this.baseHistoryCleanup) {
      this.baseHistoryCleanup()
      this.baseHistoryCleanup = null
    }

    this.stacks.clear()
    this.history.destroy()
  }

  getLastActiveContextKey(): MaybePromise<string | null> {
    return this.stacks.getStoredActiveContext()
  }
}
