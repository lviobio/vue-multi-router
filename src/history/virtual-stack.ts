import type {
  ContextHistoryState,
  HistoryLocation,
  HistoryState,
  NavigationCallback,
  NavigationInformation,
  VirtualStack,
} from './types'
import { VirtualStackStorage, type ContextStorageAdapter, type MaybePromise } from './storage'

export class VirtualStackManager {
  private contexts = new Map<string, ContextHistoryState>()
  private storage: VirtualStackStorage
  private pendingSaves = new Set<string>()

  constructor(storageAdapter?: ContextStorageAdapter) {
    this.storage = new VirtualStackStorage(storageAdapter)
  }

  has(contextKey: string): boolean {
    return this.contexts.has(contextKey)
  }

  get(contextKey: string): ContextHistoryState | undefined {
    return this.contexts.get(contextKey)
  }

  create(contextKey: string, initialStack: VirtualStack, historyEnabled: boolean = true): void {
    this.contexts.set(contextKey, {
      virtualStack: initialStack,
      listeners: new Set(),
      historyEnabled,
    })
  }

  isHistoryEnabled(contextKey: string): boolean {
    return this.contexts.get(contextKey)?.historyEnabled ?? true
  }

  remove(contextKey: string, keepStorage: boolean = false): void {
    this.contexts.delete(contextKey)
    if (!keepStorage) {
      this.storage.clear(contextKey)
    }
  }

  /**
   * Purge a context's persisted virtual stack from storage without touching any
   * in-memory state. Use to discard a `keepHistory` context that was kept on
   * unregister (for reload restore) but is now intentionally closed.
   */
  clearStoredStack(contextKey: string): void {
    this.storage.clear(contextKey)
  }

  /**
   * Force the entry at `position` to the given location. Used on popstate:
   * the browser entry is authoritative for its owner context's location, and
   * the virtual entry can disagree when it was backfilled after the persisted
   * stack was reset (e.g. a context re-registered with a fresh stack while
   * older browser entries still reference higher stack indexes).
   */
  syncEntryLocation(contextKey: string, position: number, location: HistoryLocation): void {
    const context = this.contexts.get(contextKey)
    const entry = context?.virtualStack.entries[position]
    if (!entry || entry.location === location) return

    console.debug('[MultiRouterHistory] syncEntryLocation', {
      contextKey,
      position,
      from: entry.location,
      to: location,
    })

    entry.location = location
    this.save(contextKey)
  }

  clear(): void {
    this.contexts.clear()
  }

  getLocation(contextKey: string, fallback: HistoryLocation): HistoryLocation {
    const context = this.contexts.get(contextKey)
    if (!context) return fallback
    return context.virtualStack.entries[context.virtualStack.position]?.location ?? fallback
  }

  getState(contextKey: string): HistoryState {
    const context = this.contexts.get(contextKey)
    if (!context) return {}
    return context.virtualStack.entries[context.virtualStack.position]?.state ?? {}
  }

  push(contextKey: string, location: HistoryLocation, state: HistoryState): number {
    const context = this.contexts.get(contextKey)
    if (!context) {
      throw new Error(`[VirtualStackManager] Context "${contextKey}" not found`)
    }

    // Truncate forward history and add new entry
    context.virtualStack.entries = context.virtualStack.entries.slice(
      0,
      context.virtualStack.position + 1,
    )
    context.virtualStack.entries.push({ location, state })
    context.virtualStack.position = context.virtualStack.entries.length - 1

    this.save(contextKey)
    return context.virtualStack.position
  }

  replace(contextKey: string, location: HistoryLocation, state: HistoryState): number {
    const context = this.contexts.get(contextKey)
    if (!context) {
      throw new Error(`[VirtualStackManager] Context "${contextKey}" not found`)
    }

    context.virtualStack.entries[context.virtualStack.position] = { location, state }

    this.save(contextKey)
    return context.virtualStack.position
  }

  navigate(
    contextKey: string,
    delta: number,
  ): { from: HistoryLocation; to: HistoryLocation; newPosition: number } | null {
    const context = this.contexts.get(contextKey)
    if (!context) return null

    const newPosition = context.virtualStack.position + delta

    if (newPosition < 0 || newPosition >= context.virtualStack.entries.length) {
      return null
    }

    const from = context.virtualStack.entries[context.virtualStack.position].location
    context.virtualStack.position = newPosition
    const to = context.virtualStack.entries[newPosition].location

    this.save(contextKey)
    return { from, to, newPosition }
  }

  setPosition(contextKey: string, position: number): void {
    const context = this.contexts.get(contextKey)
    if (!context) return

    if (position >= 0 && position < context.virtualStack.entries.length) {
      context.virtualStack.position = position
      this.save(contextKey)
    }
  }

  ensureEntriesUpTo(contextKey: string, position: number, fallbackLocation: HistoryLocation): void {
    const context = this.contexts.get(contextKey)
    if (!context) return

    while (context.virtualStack.entries.length <= position) {
      context.virtualStack.entries.push({ location: fallbackLocation, state: {} })
    }
  }

  addListener(contextKey: string, callback: NavigationCallback): () => void {
    const context = this.contexts.get(contextKey)
    if (!context) {
      throw new Error(`[VirtualStackManager] Context "${contextKey}" not found`)
    }

    context.listeners.add(callback)
    return () => context.listeners.delete(callback)
  }

  notifyListeners(
    contextKey: string,
    to: HistoryLocation,
    from: HistoryLocation,
    info: NavigationInformation,
  ): void {
    const context = this.contexts.get(contextKey)
    if (!context) return

    context.listeners.forEach((callback) => callback(to, from, info))
  }

  /**
   * Persist a context's stack, coalescing all mutations within the current
   * task into a single adapter write (a popstate can reposition several
   * contexts, a push saves then immediately repositions, …). The microtask
   * flush still runs before the browser processes navigation/unload.
   */
  save(contextKey: string): void {
    if (this.pendingSaves.has(contextKey)) return
    this.pendingSaves.add(contextKey)

    queueMicrotask(() => {
      this.pendingSaves.delete(contextKey)
      // The context may have been removed while the save was pending —
      // never resurrect a cleared stack
      const context = this.contexts.get(contextKey)
      if (context) {
        this.storage.save(contextKey, context.virtualStack)
      }
    })
  }

  restore(contextKey: string): MaybePromise<VirtualStack | null> {
    return this.storage.restore(contextKey)
  }

  saveActiveContext(contextKey: string): MaybePromise<void> {
    return this.storage.saveActiveContext(contextKey)
  }

  getStoredActiveContext(): MaybePromise<string | null> {
    return this.storage.getActiveContext()
  }

  saveActiveHistoryContext(contextKey: string): MaybePromise<void> {
    return this.storage.saveActiveHistoryContext(contextKey)
  }

  getStoredActiveHistoryContext(): MaybePromise<string | null> {
    return this.storage.getActiveHistoryContext()
  }

  clearActiveContext(): MaybePromise<void> {
    return this.storage.clearActiveContext()
  }

  clearActiveHistoryContext(): MaybePromise<void> {
    return this.storage.clearActiveHistoryContext()
  }

  saveContextStack(stack: string[]): MaybePromise<void> {
    return this.storage.saveContextStack(stack)
  }

  getContextStack(): MaybePromise<string[]> {
    return this.storage.getContextStack()
  }

  saveHistoryContextStack(stack: string[]): MaybePromise<void> {
    return this.storage.saveHistoryContextStack(stack)
  }

  getHistoryContextStack(): MaybePromise<string[]> {
    return this.storage.getHistoryContextStack()
  }

  // Iteration
  entries(): IterableIterator<[string, ContextHistoryState]> {
    return this.contexts.entries()
  }
}
