import { KeyValueStorageAdapter } from './key-value-adapter'

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
