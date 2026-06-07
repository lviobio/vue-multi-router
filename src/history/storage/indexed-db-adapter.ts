import { KeyValueStorageAdapter } from './key-value-adapter'

export interface IndexedDBStorageAdapterOptions {
  /** @default 'vue-multi-router' */
  dbName?: string
  /** @default 'router-state' */
  storeName?: string
}

/**
 * Persists router state in IndexedDB. Unlike sessionStorage it survives the
 * tab being closed and is shared between tabs of the same origin.
 *
 * All operations are asynchronous — the library restores contexts through the
 * promise-based adapter path (`MaybePromise`), so no extra setup is needed.
 */
export class IndexedDBStorageAdapter extends KeyValueStorageAdapter {
  private dbName: string
  private storeName: string
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor(options?: IndexedDBStorageAdapterOptions) {
    super()
    this.dbName = options?.dbName ?? 'vue-multi-router'
    this.storeName = options?.storeName ?? 'router-state'
  }

  private openDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1)

        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(this.storeName)) {
            request.result.createObjectStore(this.storeName)
          }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      // Allow a retry on the next operation if opening failed
      this.dbPromise.catch(() => {
        this.dbPromise = null
      })
    }
    return this.dbPromise
  }

  private request<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return this.openDB().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const request = operation(
            db.transaction(this.storeName, mode).objectStore(this.storeName),
          )
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }),
    )
  }

  protected getItem(key: string): Promise<string | null> {
    return this.request('readonly', (store) => store.get(key)).then((value) =>
      typeof value === 'string' ? value : null,
    )
  }

  protected setItem(key: string, value: string): Promise<void> {
    return this.request('readwrite', (store) => store.put(value, key)).then(() => undefined)
  }

  protected removeItem(key: string): Promise<void> {
    return this.request('readwrite', (store) => store.delete(key)).then(() => undefined)
  }
}
