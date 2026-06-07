import type { VirtualStack } from '../types'
import {
  isPromise,
  mapMaybePromise,
  type ContextStorageAdapter,
  type MaybePromise,
  type StoredVirtualStack,
} from './types'

const STACK_STORAGE_PREFIX = '__multiRouter_stack_'
const ACTIVE_CONTEXT_STORAGE_KEY = '__multiRouterActiveContext'
const ACTIVE_HISTORY_CONTEXT_STORAGE_KEY = '__multiRouterActiveHistoryContext'
const CONTEXT_STACK_STORAGE_KEY = '__multiRouterContextStack'
const HISTORY_CONTEXT_STACK_STORAGE_KEY = '__multiRouterHistoryContextStack'

/**
 * Runs a storage operation, converting sync throws and async rejections into a
 * warning + fallback value, so a failing adapter never breaks navigation.
 */
function guard<T>(label: string, fallback: T, op: () => MaybePromise<T>): MaybePromise<T> {
  try {
    const result = op()
    if (isPromise(result)) {
      return result.catch((e) => {
        console.warn(`[KeyValueStorageAdapter] ${label} failed:`, e)
        return fallback
      })
    }
    return result
  } catch (e) {
    console.warn(`[KeyValueStorageAdapter] ${label} failed:`, e)
    return fallback
  }
}

/**
 * Implements the full {@link ContextStorageAdapter} contract on top of three
 * key-value primitives. To create a custom storage backend (IndexedDB, a
 * server API, …) extend this class and implement only `getItem`, `setItem`
 * and `removeItem` — each may return a value synchronously or a Promise.
 *
 * Serialization, storage keys and error handling (a failing backend logs a
 * warning instead of breaking navigation) are taken care of here.
 *
 * ```ts
 * class ServerStorageAdapter extends KeyValueStorageAdapter {
 *   protected async getItem(key: string) {
 *     const res = await fetch(`/api/router-state/${encodeURIComponent(key)}`)
 *     return res.ok ? res.text() : null
 *   }
 *   protected async setItem(key: string, value: string) {
 *     await fetch(`/api/router-state/${encodeURIComponent(key)}`, { method: 'PUT', body: value })
 *   }
 *   protected async removeItem(key: string) {
 *     await fetch(`/api/router-state/${encodeURIComponent(key)}`, { method: 'DELETE' })
 *   }
 * }
 * ```
 */
export abstract class KeyValueStorageAdapter implements ContextStorageAdapter {
  protected abstract getItem(key: string): MaybePromise<string | null>
  protected abstract setItem(key: string, value: string): MaybePromise<void>
  protected abstract removeItem(key: string): MaybePromise<void>

  private getStackStorageKey(contextKey: string): string {
    return `${STACK_STORAGE_PREFIX}${contextKey}`
  }

  saveStack(contextKey: string, stack: VirtualStack): MaybePromise<void> {
    const data: StoredVirtualStack = {
      entries: stack.entries,
      position: stack.position,
    }
    return guard('saveStack', undefined, () =>
      this.setItem(this.getStackStorageKey(contextKey), JSON.stringify(data)),
    )
  }

  restoreStack(contextKey: string): MaybePromise<StoredVirtualStack | null> {
    return guard('restoreStack', null, () =>
      mapMaybePromise(this.getItem(this.getStackStorageKey(contextKey)), (stored) => {
        if (!stored) return null

        const data = JSON.parse(stored) as StoredVirtualStack

        if (data && Array.isArray(data.entries) && data.entries.length > 0) {
          // Validate position is within bounds
          const position = Math.min(Math.max(0, data.position ?? 0), data.entries.length - 1)

          return {
            entries: data.entries,
            position,
          }
        }
        return null
      }),
    )
  }

  clearStack(contextKey: string): MaybePromise<void> {
    return guard('clearStack', undefined, () =>
      this.removeItem(this.getStackStorageKey(contextKey)),
    )
  }

  saveActiveContext(contextKey: string): MaybePromise<void> {
    return guard('saveActiveContext', undefined, () =>
      this.setItem(ACTIVE_CONTEXT_STORAGE_KEY, contextKey),
    )
  }

  getActiveContext(): MaybePromise<string | null> {
    return guard('getActiveContext', null, () => this.getItem(ACTIVE_CONTEXT_STORAGE_KEY))
  }

  clearActiveContext(): MaybePromise<void> {
    return guard('clearActiveContext', undefined, () => this.removeItem(ACTIVE_CONTEXT_STORAGE_KEY))
  }

  saveActiveHistoryContext(contextKey: string): MaybePromise<void> {
    return guard('saveActiveHistoryContext', undefined, () =>
      this.setItem(ACTIVE_HISTORY_CONTEXT_STORAGE_KEY, contextKey),
    )
  }

  getActiveHistoryContext(): MaybePromise<string | null> {
    return guard('getActiveHistoryContext', null, () =>
      this.getItem(ACTIVE_HISTORY_CONTEXT_STORAGE_KEY),
    )
  }

  clearActiveHistoryContext(): MaybePromise<void> {
    return guard('clearActiveHistoryContext', undefined, () =>
      this.removeItem(ACTIVE_HISTORY_CONTEXT_STORAGE_KEY),
    )
  }

  saveContextStack(stack: string[]): MaybePromise<void> {
    return guard('saveContextStack', undefined, () =>
      this.setItem(CONTEXT_STACK_STORAGE_KEY, JSON.stringify(stack)),
    )
  }

  getContextStack(): MaybePromise<string[]> {
    return this.getStoredArray(CONTEXT_STACK_STORAGE_KEY, 'getContextStack')
  }

  saveHistoryContextStack(stack: string[]): MaybePromise<void> {
    return guard('saveHistoryContextStack', undefined, () =>
      this.setItem(HISTORY_CONTEXT_STACK_STORAGE_KEY, JSON.stringify(stack)),
    )
  }

  getHistoryContextStack(): MaybePromise<string[]> {
    return this.getStoredArray(HISTORY_CONTEXT_STACK_STORAGE_KEY, 'getHistoryContextStack')
  }

  private getStoredArray(key: string, label: string): MaybePromise<string[]> {
    return guard(label, [], () =>
      mapMaybePromise(this.getItem(key), (stored) => {
        if (!stored) return []
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      }),
    )
  }
}
