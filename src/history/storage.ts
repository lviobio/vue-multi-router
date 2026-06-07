import type { VirtualStack } from './types'
import {
  type ContextStorageAdapter,
  type MaybePromise,
  type StoredVirtualStack,
  SessionStorageAdapter,
  flatMapMaybePromise,
  isPromise,
  resolveValue,
} from './storage/index'

export type { ContextStorageAdapter, MaybePromise, StoredVirtualStack }

const ACTIVE_CONTEXT_CACHE_KEY = '__activeContext'
const ACTIVE_HISTORY_CONTEXT_CACHE_KEY = '__activeHistoryContext'
const CONTEXT_STACK_CACHE_KEY = '__contextStack'
const HISTORY_CONTEXT_STACK_CACHE_KEY = '__historyContextStack'

/**
 * Sits between the virtual stack manager and the storage adapter, adding two
 * guarantees that matter for asynchronous adapters (IndexedDB, a server API):
 *
 * - **Write sequencing.** Writes are chained FIFO, so a slow earlier write can
 *   never overwrite a later one when responses arrive out of order. Reads are
 *   ordered after pending writes (read-your-writes), but don't extend the
 *   chain — boot-time restores still run in parallel.
 * - **Write dedupe.** Saving a value identical to the last written one is
 *   skipped entirely — context activations repeatedly persist the same keys.
 *
 * For the synchronous SessionStorageAdapter the chain never materializes
 * (everything stays sync), so this layer adds no overhead.
 */
export class VirtualStackStorage {
  private adapter: ContextStorageAdapter
  private lastWrite: MaybePromise<unknown> = undefined
  private lastWritten = new Map<string, string>()

  constructor(adapter?: ContextStorageAdapter) {
    this.adapter = adapter ?? new SessionStorageAdapter()
  }

  private chainWrite(op: () => MaybePromise<void>): MaybePromise<void> {
    const result = flatMapMaybePromise(this.lastWrite, () => op())
    // Keep the chain alive even if this write fails
    this.lastWrite = isPromise(result) ? result.catch(() => undefined) : undefined
    return result
  }

  private afterWrites<T>(op: () => MaybePromise<T>): MaybePromise<T> {
    return flatMapMaybePromise(this.lastWrite, () => op())
  }

  private writeIfChanged(
    cacheKey: string,
    serialized: string,
    op: () => MaybePromise<void>,
  ): MaybePromise<void> {
    if (this.lastWritten.get(cacheKey) === serialized) return
    this.lastWritten.set(cacheKey, serialized)
    return this.chainWrite(op)
  }

  save(contextKey: string, stack: VirtualStack): MaybePromise<void> {
    const serialized = JSON.stringify({ entries: stack.entries, position: stack.position })
    return this.writeIfChanged(`stack:${contextKey}`, serialized, () =>
      this.adapter.saveStack(contextKey, stack),
    )
  }

  restore(contextKey: string): MaybePromise<VirtualStack | null> {
    return this.afterWrites(() => this.adapter.restoreStack(contextKey))
  }

  clear(contextKey: string): MaybePromise<void> {
    this.lastWritten.delete(`stack:${contextKey}`)
    return this.chainWrite(() => this.adapter.clearStack(contextKey))
  }

  saveActiveContext(contextKey: string): MaybePromise<void> {
    return this.writeIfChanged(ACTIVE_CONTEXT_CACHE_KEY, contextKey, () =>
      this.adapter.saveActiveContext(contextKey),
    )
  }

  getActiveContext(): MaybePromise<string | null> {
    return this.afterWrites(() => this.adapter.getActiveContext())
  }

  saveActiveHistoryContext(contextKey: string): MaybePromise<void> {
    return this.writeIfChanged(ACTIVE_HISTORY_CONTEXT_CACHE_KEY, contextKey, () =>
      this.adapter.saveActiveHistoryContext(contextKey),
    )
  }

  getActiveHistoryContext(): MaybePromise<string | null> {
    return this.afterWrites(() => this.adapter.getActiveHistoryContext())
  }

  clearActiveContext(): MaybePromise<void> {
    this.lastWritten.delete(ACTIVE_CONTEXT_CACHE_KEY)
    return this.chainWrite(() => this.adapter.clearActiveContext())
  }

  clearActiveHistoryContext(): MaybePromise<void> {
    this.lastWritten.delete(ACTIVE_HISTORY_CONTEXT_CACHE_KEY)
    return this.chainWrite(() => this.adapter.clearActiveHistoryContext())
  }

  saveContextStack(stack: string[]): MaybePromise<void> {
    return this.writeIfChanged(CONTEXT_STACK_CACHE_KEY, JSON.stringify(stack), () =>
      this.adapter.saveContextStack(stack),
    )
  }

  getContextStack(): MaybePromise<string[]> {
    return this.afterWrites(() => this.adapter.getContextStack())
  }

  saveHistoryContextStack(stack: string[]): MaybePromise<void> {
    return this.writeIfChanged(HISTORY_CONTEXT_STACK_CACHE_KEY, JSON.stringify(stack), () =>
      this.adapter.saveHistoryContextStack(stack),
    )
  }

  getHistoryContextStack(): MaybePromise<string[]> {
    return this.afterWrites(() => this.adapter.getHistoryContextStack())
  }

  resolveValue = resolveValue
}
