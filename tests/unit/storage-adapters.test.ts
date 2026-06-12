import { describe, it, expect, vi } from 'vitest'
import { KeyValueStorageAdapter } from '../../src/history/storage/key-value-adapter'
import { VirtualStackStorage } from '../../src/history/storage'
import { VirtualStackManager } from '../../src/history/virtual-stack'
import type { MaybePromise } from '../../src/history/storage/types'
import { MultiRouterManagerInstance } from '../../src/contextManager'
import { createTestHistory, createTestRouter, delay, waitFor } from './utils/test-helpers'
import type { RouterHistory } from 'vue-router'

/**
 * In-memory adapter built on the 3-method KeyValueStorageAdapter base.
 * `delayMs` (or a per-call queue of delays) makes every operation async,
 * exercising the promise-based restore/save paths.
 */
class MemoryAdapter extends KeyValueStorageAdapter {
  store = new Map<string, string>()
  writeDelays: number[] = []

  constructor(private delayMs = 0) {
    super()
  }

  private maybeDelay<T>(value: T, ms: number): MaybePromise<T> {
    if (ms <= 0) return value
    return delay(ms).then(() => value)
  }

  protected getItem(key: string): MaybePromise<string | null> {
    return this.maybeDelay(this.store.get(key) ?? null, this.delayMs)
  }

  protected setItem(key: string, value: string): MaybePromise<void> {
    const ms = this.writeDelays.shift() ?? this.delayMs
    if (ms <= 0) {
      this.store.set(key, value)
      return
    }
    return delay(ms).then(() => {
      this.store.set(key, value)
    })
  }

  protected removeItem(key: string): MaybePromise<void> {
    this.store.delete(key)
    return this.maybeDelay(undefined, this.delayMs) as MaybePromise<void>
  }
}

function createAsyncManager(
  adapter: MemoryAdapter,
  historyLocation = '/',
): {
  manager: MultiRouterManagerInstance
  history: RouterHistory
} {
  const history = createTestHistory(historyLocation)
  const makeRouter = (_key: string, ctxHistory: RouterHistory) => createTestRouter(ctxHistory)
  const manager = new MultiRouterManagerInstance(
    null as any,
    { history, storageAdapter: adapter },
    makeRouter,
  )
  return { manager, history }
}

describe('KeyValueStorageAdapter', () => {
  it('round-trips a virtual stack through the 3-method backend', () => {
    const adapter = new MemoryAdapter()
    const stack = {
      entries: [
        { location: '/', state: {} },
        { location: '/page-a?x=1', state: { foo: 'bar' } },
      ],
      position: 1,
    }

    adapter.saveStack('ctx', stack)
    expect(adapter.restoreStack('ctx')).toEqual(stack)
  })

  it('clamps an out-of-bounds stored position', () => {
    const adapter = new MemoryAdapter()
    adapter.saveStack('ctx', { entries: [{ location: '/', state: {} }], position: 5 })
    expect(adapter.restoreStack('ctx')).toEqual({
      entries: [{ location: '/', state: {} }],
      position: 0,
    })
  })

  it('returns fallbacks instead of throwing when the backend fails', async () => {
    class FailingAdapter extends KeyValueStorageAdapter {
      protected getItem(): Promise<string | null> {
        return Promise.reject(new Error('boom'))
      }
      protected setItem(): Promise<void> {
        return Promise.reject(new Error('boom'))
      }
      protected removeItem(): void {
        throw new Error('boom')
      }
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const adapter = new FailingAdapter()

    await expect(adapter.restoreStack('ctx')).resolves.toBeNull()
    await expect(adapter.getContextStack()).resolves.toEqual([])
    await expect(
      adapter.saveStack('ctx', { entries: [{ location: '/', state: {} }], position: 0 }),
    ).resolves.toBeUndefined()
    expect(adapter.clearStack('ctx')).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('round-trips active context and context stacks asynchronously', async () => {
    const adapter = new MemoryAdapter(1)

    await adapter.saveActiveContext('panel-1')
    await adapter.saveContextStack(['main', 'panel-1'])

    await expect(adapter.getActiveContext()).resolves.toBe('panel-1')
    await expect(adapter.getContextStack()).resolves.toEqual(['main', 'panel-1'])
  })
})

describe('VirtualStackStorage sequencing & dedupe', () => {
  it('applies async writes in FIFO order even when an earlier write is slower', async () => {
    const adapter = new MemoryAdapter()
    // First write takes 30ms, second takes 1ms — without sequencing the
    // slow first write would land last and clobber the newer value
    adapter.writeDelays = [30, 1]
    const storage = new VirtualStackStorage(adapter)

    storage.save('ctx', { entries: [{ location: '/old', state: {} }], position: 0 })
    storage.save('ctx', { entries: [{ location: '/new', state: {} }], position: 0 })

    await delay(60)
    expect(adapter.store.get('__multiRouter_stack_ctx')).toContain('/new')
  })

  it('orders reads after pending writes (read-your-writes)', async () => {
    const adapter = new MemoryAdapter()
    adapter.writeDelays = [20]
    const storage = new VirtualStackStorage(adapter)

    storage.save('ctx', { entries: [{ location: '/saved', state: {} }], position: 0 })
    const restored = await storage.restore('ctx')

    expect(restored?.entries[0].location).toBe('/saved')
  })

  it('skips writes whose value matches the last written one', () => {
    const adapter = new MemoryAdapter()
    const spy = vi.spyOn(adapter, 'saveActiveContext')
    const storage = new VirtualStackStorage(adapter)

    storage.saveActiveContext('panel-1')
    storage.saveActiveContext('panel-1')
    storage.saveActiveContext('panel-2')
    storage.saveActiveContext('panel-1')

    expect(spy).toHaveBeenCalledTimes(3)
  })
})

describe('VirtualStackManager save coalescing', () => {
  it('coalesces same-task mutations into a single adapter write', async () => {
    const adapter = new MemoryAdapter()
    const spy = vi.spyOn(adapter, 'saveStack')
    const stacks = new VirtualStackManager(adapter)
    stacks.create('ctx', { entries: [{ location: '/', state: {} }], position: 0 })

    stacks.push('ctx', '/page-a', {})
    stacks.push('ctx', '/page-b', {})
    stacks.setPosition('ctx', 0)

    expect(spy).not.toHaveBeenCalled() // deferred to a microtask
    await Promise.resolve()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(adapter.restoreStack('ctx')).toMatchObject({ position: 0 })
  })

  it('does not resurrect a stack removed while a save was pending', async () => {
    const adapter = new MemoryAdapter()
    const spy = vi.spyOn(adapter, 'saveStack')
    const stacks = new VirtualStackManager(adapter)
    stacks.create('ctx', { entries: [{ location: '/', state: {} }], position: 0 })

    stacks.push('ctx', '/page-a', {})
    stacks.remove('ctx')

    await Promise.resolve()
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('async storage adapter end-to-end (manager level)', () => {
  it('registers a context through a promise-based adapter', async () => {
    const adapter = new MemoryAdapter(5)
    const { manager } = createAsyncManager(adapter)

    const registration = manager.register('panel', 'ctx-a')
    expect(registration).toBeInstanceOf(Promise)
    expect(manager.has('ctx-a')).toBe(false) // not yet — restore in flight

    await registration
    expect(manager.has('ctx-a')).toBe(true)
    expect(manager.getRouter('ctx-a')).toBeTruthy()
  })

  it('returns the same in-flight promise for a duplicate register call', async () => {
    const adapter = new MemoryAdapter(5)
    const { manager } = createAsyncManager(adapter)

    const first = manager.register('panel', 'ctx-a')
    const second = manager.register('panel', 'ctx-a')
    expect(second).toBe(first)

    await first
    expect(manager.has('ctx-a')).toBe(true)
  })

  it('restores a previously persisted stack through the async adapter', async () => {
    const adapter = new MemoryAdapter(2)

    // First session: navigate and let the state persist
    const first = createAsyncManager(adapter)
    await first.manager.register('panel', 'ctx-a', { initialLocation: '/page-a' })
    first.manager.setActive('ctx-a', true)
    const router = first.manager.getRouter('ctx-a')
    await router.isReady()
    await router.push('/page-b')
    await waitFor(() => {
      const stored = adapter.store.get('__multiRouter_stack_ctx-a')
      return !!stored && stored.includes('/page-b')
    })

    // Second session over the same backend (browser URL still on /page-b,
    // as after a real reload): the stack must come back
    const second = createAsyncManager(adapter, '/page-b')
    await second.manager.register('panel', 'ctx-a')
    const restoredRouter = second.manager.getRouter('ctx-a')
    await restoredRouter.isReady()
    await waitFor(() => restoredRouter.currentRoute.value.fullPath === '/page-b')
  })
})

describe('KeyValueStorageAdapter.namespace', () => {
  it('reads/writes app state through the same backend, prefixed', async () => {
    const adapter = new MemoryAdapter()
    const store = adapter.namespace('panels:')

    await store.setItem('list', '[1,2,3]')
    expect(adapter.store.get('panels:list')).toBe('[1,2,3]') // same backend, prefixed key
    expect(await store.getItem('list')).toBe('[1,2,3]')

    await store.removeItem('list')
    expect(await store.getItem('list')).toBeNull()
    expect(adapter.store.has('panels:list')).toBe(false)
  })

  it('keeps app keys disjoint from the router history keys', async () => {
    const adapter = new MemoryAdapter()
    adapter.saveActiveContext('ctx-a') // a router-owned key
    await adapter.namespace('panels:').setItem('list', 'x')
    expect([...adapter.store.keys()].sort()).toEqual(
      ['__multiRouterActiveContext', 'panels:list'].sort(),
    )
  })

  it('works through an async backend', async () => {
    const store = new MemoryAdapter(1).namespace('p:')
    await store.setItem('k', 'v')
    expect(await store.getItem('k')).toBe('v')
  })
})
