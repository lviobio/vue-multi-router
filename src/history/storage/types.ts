import type { VirtualStack } from '../types'

export type MaybePromise<T> = T | Promise<T>

export interface StoredVirtualStack {
  entries: Array<{ location: string; state: Record<string, any> }>
  position: number
}

export interface ContextStorageAdapter {
  saveStack(contextKey: string, stack: VirtualStack): MaybePromise<void>
  restoreStack(contextKey: string): MaybePromise<StoredVirtualStack | null>
  clearStack(contextKey: string): MaybePromise<void>

  saveActiveContext(contextKey: string): MaybePromise<void>
  getActiveContext(): MaybePromise<string | null>
  clearActiveContext(): MaybePromise<void>

  saveActiveHistoryContext(contextKey: string): MaybePromise<void>
  getActiveHistoryContext(): MaybePromise<string | null>
  clearActiveHistoryContext(): MaybePromise<void>

  /**
   * Save the stack of previously active contexts (for fallback when closing a context)
   */
  saveContextStack(stack: string[]): MaybePromise<void>
  /**
   * Get the stack of previously active contexts
   */
  getContextStack(): MaybePromise<string[]>

  /**
   * Save the stack of previously active history contexts (for fallback when closing a context)
   */
  saveHistoryContextStack(stack: string[]): MaybePromise<void>
  /**
   * Get the stack of previously active history contexts
   */
  getHistoryContextStack(): MaybePromise<string[]>
}

export function isPromise<T>(value: MaybePromise<T>): value is Promise<T> {
  return value instanceof Promise
}

export function resolveValue<T>(value: MaybePromise<T>, callback: (resolved: T) => void): void {
  if (isPromise(value)) {
    value.then(callback)
  } else {
    callback(value)
  }
}

export function mapMaybePromise<T, R>(value: MaybePromise<T>, fn: (v: T) => R): MaybePromise<R> {
  if (isPromise(value)) {
    return value.then(fn)
  }
  return fn(value)
}

export function flatMapMaybePromise<T, R>(
  value: MaybePromise<T>,
  fn: (v: T) => MaybePromise<R>,
): MaybePromise<R> {
  if (isPromise(value)) {
    return value.then(fn)
  }
  return fn(value)
}
