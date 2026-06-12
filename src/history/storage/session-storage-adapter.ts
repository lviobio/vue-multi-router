import { KeyValueStorageAdapter } from './key-value-adapter'
import type { KeyValueStore } from './types'

/**
 * A bare sessionStorage-backed {@link KeyValueStore} for app-level state (the
 * default backend for `createPanelManager`). Use `adapter.namespace(prefix)`
 * instead to share whatever backend the router is configured with.
 */
export const sessionKeyValueStore: KeyValueStore = {
  getItem: (key) => sessionStorage.getItem(key),
  setItem: (key, value) => sessionStorage.setItem(key, value),
  removeItem: (key) => sessionStorage.removeItem(key),
}

export class SessionStorageAdapter extends KeyValueStorageAdapter {
  protected getItem(key: string): string | null {
    return sessionStorage.getItem(key)
  }

  protected setItem(key: string, value: string): void {
    sessionStorage.setItem(key, value)
  }

  protected removeItem(key: string): void {
    sessionStorage.removeItem(key)
  }
}
