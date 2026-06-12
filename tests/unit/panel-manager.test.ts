import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { createPanelManager } from '../../src/panel-manager'
import type { KeyValueStore } from '../../src/history/storage/types'
import type { MultiRouterManagerInstance } from '../../src/contextManager'
import { waitFor } from './utils/test-helpers'

// --- fakes ----------------------------------------------------------------

/** In-memory KeyValueStore; `async` wraps every op in a resolved promise to
 *  exercise the MaybePromise path. Tracks write count to assert persistence. */
function memStore(async = false): KeyValueStore & { map: Map<string, string>; writes: number } {
  const map = new Map<string, string>()
  const wrap = <T>(v: T) => (async ? Promise.resolve(v) : v)
  const store = {
    map,
    writes: 0,
    getItem: (k: string) => wrap(map.get(k) ?? null),
    setItem: (k: string, v: string) => {
      store.writes++
      map.set(k, v)
      return wrap(undefined)
    },
    removeItem: (k: string) => {
      map.delete(k)
      return wrap(undefined)
    },
  }
  return store
}

/** Minimal manager stub: records setActive calls; `registered` controls has(). */
function fakeManager(opts: { registered?: 'all' | string[]; active?: string } = {}) {
  const reg = opts.registered ?? 'all'
  const calls: string[] = []
  let active = opts.active
  const manager = {
    has: (k: string) => reg === 'all' || reg.includes(k),
    setActive: (k: string) => {
      active = k
      calls.push(k)
      return true
    },
    getActiveContext: () => (active ? { key: active } : undefined),
  } as unknown as MultiRouterManagerInstance
  return { manager, calls, getActive: () => active }
}

const ids = (pm: ReturnType<typeof createPanelManager>) => pm.panels.value.map((p) => p.id)

// --- tests ----------------------------------------------------------------

describe('createPanelManager', () => {
  it('opens panels and activates the new context', async () => {
    const { manager, calls } = fakeManager()
    const pm = createPanelManager({ storage: memStore() })

    const id = await pm.open('/a', 'drawer', {}, manager)

    expect(id).toBe('panel-1')
    expect(pm.panels.value).toHaveLength(1)
    expect(pm.panels.value[0]).toMatchObject({ id: 'panel-1', epoch: 1, surface: 'drawer', z: 1 })
    expect(calls).toEqual(['panel-1__1']) // activated after registration
  })

  it('derives context name from id + epoch', async () => {
    const { manager } = fakeManager()
    const pm = createPanelManager({ storage: memStore() })
    await pm.open('/a', 'drawer', {}, manager)
    expect(pm.contextName(pm.panels.value[0])).toBe('panel-1__1')
  })

  it('reclaims ids and z when panels close (no standing counter)', async () => {
    const { manager } = fakeManager()
    const pm = createPanelManager({ storage: memStore() })

    await pm.open('/a', 'drawer', {}, manager)
    pm.close('panel-1')
    await pm.open('/b', 'drawer', {}, manager)
    expect(ids(pm)).toEqual(['panel-1']) // reset, not panel-2

    await pm.open('/c', 'drawer', {}, manager)
    await pm.open('/d', 'drawer', {}, manager)
    expect(ids(pm)).toEqual(['panel-1', 'panel-2', 'panel-3'])

    pm.close('panel-2')
    await pm.open('/e', 'drawer', {}, manager) // max(1,3)+1
    expect(ids(pm)).toEqual(['panel-1', 'panel-3', 'panel-4'])
    expect(pm.panels.value.map((p) => p.z)).toEqual([1, 3, 4])
  })

  it('move bumps epoch so old/new context names are disjoint', async () => {
    const { manager } = fakeManager()
    const pm = createPanelManager({ storage: memStore() })
    await pm.open('/a', 'drawer', {}, manager)
    const before = pm.contextName(pm.panels.value[0])

    await pm.moveTo('panel-1', 'modal', manager)
    const after = pm.contextName(pm.panels.value[0])

    expect(pm.panels.value[0]).toMatchObject({ surface: 'modal', epoch: 2 })
    expect(before).toBe('panel-1__1')
    expect(after).toBe('panel-1__2')
    expect(after).not.toBe(before)
  })

  it('re-asserts activation after moving the panel that owned the URL', async () => {
    const { manager, calls } = fakeManager()
    const pm = createPanelManager({ storage: memStore() })
    await pm.open('/a', 'drawer', {}, manager) // open activates panel-1__1
    calls.length = 0

    await pm.moveTo('panel-1', 'modal', manager)
    expect(calls).toEqual(['panel-1__2']) // pulled the URL back to the moved panel
  })

  it('does not re-activate a move of a non-active panel', async () => {
    // registered:[] → open() can't activate, so another context stays active.
    const { manager, calls } = fakeManager({ registered: [], active: 'someone-else' })
    const pm = createPanelManager({ storage: memStore() })
    await pm.open('/a', 'drawer', {}, manager)
    expect(calls).toEqual([]) // open didn't activate (context not registered)
    await pm.moveTo('panel-1', 'modal', manager)
    expect(calls).toEqual([]) // panel wasn't active → no re-assertion
  })

  it('focus raises z (and activates) only when not already on top', async () => {
    const { manager, calls } = fakeManager()
    const pm = createPanelManager({ storage: memStore() })
    await pm.open('/a', 'modal', {}, manager)
    await pm.open('/b', 'modal', {}, manager)
    calls.length = 0

    pm.focus('panel-1', manager) // behind → raise
    expect(pm.panels.value.find((p) => p.id === 'panel-1')!.z).toBe(3)
    expect(calls).toEqual(['panel-1__1'])

    calls.length = 0
    pm.focus('panel-1', manager) // already on top → no-op for z, still activates
    expect(pm.panels.value.find((p) => p.id === 'panel-1')!.z).toBe(3)
  })

  it('update merges meta; { persist:false } skips the write', async () => {
    const { manager } = fakeManager()
    const store = memStore()
    const pm = createPanelManager<{ rect: { x: number; y: number } }>({ storage: store })
    await pm.open('/a', 'modal', { rect: { x: 1, y: 2 } }, manager)

    pm.update('panel-1', { rect: { x: 9, y: 2 } })
    expect(pm.panels.value[0].meta.rect).toEqual({ x: 9, y: 2 })

    const writesBefore = store.writes
    pm.update('panel-1', { rect: { x: 9, y: 9 } }, { persist: false })
    expect(pm.panels.value[0].meta.rect).toEqual({ x: 9, y: 9 })
    expect(store.writes).toBe(writesBefore) // not persisted
  })

  it('persists and restores panels (sync store)', async () => {
    const { manager } = fakeManager()
    const store = memStore()
    const pm1 = createPanelManager<{ rect: { x: number } }>({ storage: store, storageKey: 'k' })
    await pm1.open('/a', 'modal', { rect: { x: 5 } }, manager)
    await pm1.open('/b', 'drawer', { rect: { x: 0 } }, manager)

    // A fresh manager over the same store rehydrates the collection.
    const pm2 = createPanelManager<{ rect: { x: number } }>({ storage: store, storageKey: 'k' })
    expect(ids(pm2)).toEqual(['panel-1', 'panel-2'])
    expect(pm2.panels.value[0].meta.rect).toEqual({ x: 5 })
    expect(pm2.wasRestored('panel-1')).toBe(true)
    expect(pm2.wasRestored('panel-3')).toBe(false)

    pm2.clearRestored()
    expect(pm2.wasRestored('panel-1')).toBe(false)
  })

  it('persists and restores through an async store', async () => {
    const { manager } = fakeManager()
    const store = memStore(true)
    const pm1 = createPanelManager({ storage: store, storageKey: 'k' })
    await pm1.open('/a', 'drawer', {}, manager)
    await nextTick()

    const pm2 = createPanelManager({ storage: store, storageKey: 'k' })
    // Async hydration populates reactively after load resolves.
    await waitFor(() => pm2.panels.value.length === 1)
    expect(ids(pm2)).toEqual(['panel-1'])
  })

  it('respects a custom id prefix', async () => {
    const { manager } = fakeManager()
    const pm = createPanelManager({ storage: memStore(), idPrefix: 'win' })
    await pm.open('/a', 'modal', {}, manager)
    expect(ids(pm)).toEqual(['win-1'])
    expect(pm.contextName(pm.panels.value[0])).toBe('win-1__1')
  })
})
