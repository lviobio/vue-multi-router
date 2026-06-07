import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VirtualStackManager } from '../../src/history/virtual-stack'
import { NavigationDirection, NavigationType } from '../../src/history/types'

function makeStack(location = '/') {
  return { entries: [{ location, state: {} }], position: 0 }
}

function makeNavInfo(delta = 1) {
  return {
    type: NavigationType.pop,
    direction: delta < 0 ? NavigationDirection.back : NavigationDirection.forward,
    delta,
  }
}

describe('VirtualStackManager', () => {
  let manager: VirtualStackManager

  beforeEach(() => {
    manager = new VirtualStackManager()
  })

  describe('has / get / create', () => {
    it('returns false for non-existent context', () => {
      expect(manager.has('ctx')).toBe(false)
    })

    it('returns true after creating a context', () => {
      manager.create('ctx', makeStack())
      expect(manager.has('ctx')).toBe(true)
    })

    it('get returns the context state', () => {
      manager.create('ctx', makeStack())
      expect(manager.get('ctx')).toBeDefined()
    })

    it('get returns undefined for non-existent context', () => {
      expect(manager.get('ctx')).toBeUndefined()
    })

    it('historyEnabled defaults to true', () => {
      manager.create('ctx', makeStack())
      expect(manager.isHistoryEnabled('ctx')).toBe(true)
    })

    it('historyEnabled can be set to false', () => {
      manager.create('ctx', makeStack(), false)
      expect(manager.isHistoryEnabled('ctx')).toBe(false)
    })

    it('isHistoryEnabled returns true for non-existent context', () => {
      expect(manager.isHistoryEnabled('missing')).toBe(true)
    })
  })

  describe('remove / clear', () => {
    it('removes a specific context', () => {
      manager.create('ctx', makeStack())
      manager.remove('ctx')
      expect(manager.has('ctx')).toBe(false)
    })

    it('remove clears the persisted stack by default', async () => {
      manager.create('ctx-clear', makeStack('/a'))
      manager.push('ctx-clear', '/b', {})
      await Promise.resolve() // flush the deferred save
      manager.remove('ctx-clear')
      expect(await manager.restore('ctx-clear')).toBeNull()
    })

    it('remove with keepStorage keeps the persisted stack', async () => {
      manager.create('ctx-keep', makeStack('/a'))
      manager.push('ctx-keep', '/b', {})
      await Promise.resolve() // flush the deferred save
      manager.remove('ctx-keep', true)
      expect(manager.has('ctx-keep')).toBe(false)
      const restored = await manager.restore('ctx-keep')
      expect(restored?.entries.map((e) => e.location)).toEqual(['/a', '/b'])
      expect(restored?.position).toBe(1)
    })

    it('clears all contexts', () => {
      manager.create('ctx-a', makeStack())
      manager.create('ctx-b', makeStack('/b'))
      manager.clear()
      expect(manager.has('ctx-a')).toBe(false)
      expect(manager.has('ctx-b')).toBe(false)
    })
  })

  describe('getLocation / getState', () => {
    it('returns fallback when context does not exist', () => {
      expect(manager.getLocation('ctx', '/fallback')).toBe('/fallback')
    })

    it('returns current entry location', () => {
      manager.create('ctx', makeStack('/home'))
      expect(manager.getLocation('ctx', '/')).toBe('/home')
    })

    it('returns empty state when context does not exist', () => {
      expect(manager.getState('ctx')).toEqual({})
    })

    it('returns current entry state', () => {
      const state = { key: 'value' }
      manager.create('ctx', { entries: [{ location: '/', state }], position: 0 })
      expect(manager.getState('ctx')).toEqual(state)
    })
  })

  describe('push', () => {
    it('adds a new entry and returns new position', () => {
      manager.create('ctx', makeStack())
      const pos = manager.push('ctx', '/about', {})
      expect(pos).toBe(1)
      expect(manager.getLocation('ctx', '/')).toBe('/about')
    })

    it('truncates forward history when pushing', () => {
      manager.create('ctx', {
        entries: [
          { location: '/', state: {} },
          { location: '/about', state: {} },
        ],
        position: 0,
      })
      manager.push('ctx', '/contact', {})
      const ctx = manager.get('ctx')!
      expect(ctx.virtualStack.entries).toHaveLength(2)
      expect(ctx.virtualStack.entries[1].location).toBe('/contact')
    })

    it('throws for non-existent context', () => {
      expect(() => manager.push('ctx', '/', {})).toThrow('[VirtualStackManager]')
    })
  })

  describe('replace', () => {
    it('replaces the current entry', () => {
      manager.create('ctx', makeStack())
      manager.replace('ctx', '/home', { replaced: true })
      expect(manager.getLocation('ctx', '/')).toBe('/home')
      expect(manager.getState('ctx')).toEqual({ replaced: true })
    })

    it('does not change the entries count', () => {
      manager.create('ctx', {
        entries: [
          { location: '/', state: {} },
          { location: '/about', state: {} },
        ],
        position: 0,
      })
      manager.replace('ctx', '/home', {})
      expect(manager.get('ctx')!.virtualStack.entries).toHaveLength(2)
    })

    it('throws for non-existent context', () => {
      expect(() => manager.replace('ctx', '/', {})).toThrow('[VirtualStackManager]')
    })
  })

  describe('navigate', () => {
    it('returns null for non-existent context', () => {
      expect(manager.navigate('ctx', 1)).toBeNull()
    })

    it('moves position forward', () => {
      manager.create('ctx', {
        entries: [
          { location: '/', state: {} },
          { location: '/about', state: {} },
        ],
        position: 0,
      })
      const result = manager.navigate('ctx', 1)
      expect(result?.to).toBe('/about')
      expect(result?.newPosition).toBe(1)
      expect(result?.from).toBe('/')
    })

    it('moves position backward', () => {
      manager.create('ctx', {
        entries: [
          { location: '/', state: {} },
          { location: '/about', state: {} },
        ],
        position: 1,
      })
      const result = manager.navigate('ctx', -1)
      expect(result?.to).toBe('/')
      expect(result?.newPosition).toBe(0)
    })

    it('returns null when delta would go below zero', () => {
      manager.create('ctx', makeStack())
      expect(manager.navigate('ctx', -1)).toBeNull()
    })

    it('returns null when delta would exceed entries', () => {
      manager.create('ctx', makeStack())
      expect(manager.navigate('ctx', 1)).toBeNull()
    })
  })

  describe('setPosition / ensureEntriesUpTo', () => {
    it('sets position within valid bounds', () => {
      manager.create('ctx', {
        entries: [
          { location: '/', state: {} },
          { location: '/about', state: {} },
        ],
        position: 0,
      })
      manager.setPosition('ctx', 1)
      expect(manager.getLocation('ctx', '/')).toBe('/about')
    })

    it('ignores position out of bounds', () => {
      manager.create('ctx', makeStack())
      manager.setPosition('ctx', 99)
      expect(manager.get('ctx')!.virtualStack.position).toBe(0)
    })

    it('does nothing for non-existent context', () => {
      expect(() => manager.setPosition('missing', 0)).not.toThrow()
    })

    it('pads entries up to the requested position with fallback location', () => {
      manager.create('ctx', makeStack())
      manager.ensureEntriesUpTo('ctx', 2, '/fallback')
      const entries = manager.get('ctx')!.virtualStack.entries
      expect(entries).toHaveLength(3)
      expect(entries[1].location).toBe('/fallback')
      expect(entries[2].location).toBe('/fallback')
    })

    it('does not reduce entries below existing count', () => {
      manager.create('ctx', {
        entries: [
          { location: '/', state: {} },
          { location: '/about', state: {} },
        ],
        position: 0,
      })
      manager.ensureEntriesUpTo('ctx', 0, '/fallback')
      expect(manager.get('ctx')!.virtualStack.entries).toHaveLength(2)
    })
  })

  describe('addListener / notifyListeners', () => {
    it('calls added listener on notify', () => {
      manager.create('ctx', makeStack())
      const cb = vi.fn()
      manager.addListener('ctx', cb)
      manager.notifyListeners('ctx', '/new', '/', makeNavInfo(1))
      expect(cb).toHaveBeenCalledWith('/new', '/', expect.objectContaining({ delta: 1 }))
    })

    it('removes listener when unsubscribe is called', () => {
      manager.create('ctx', makeStack())
      const cb = vi.fn()
      const unsubscribe = manager.addListener('ctx', cb)
      unsubscribe()
      manager.notifyListeners('ctx', '/new', '/', makeNavInfo(1))
      expect(cb).not.toHaveBeenCalled()
    })

    it('supports multiple listeners independently', () => {
      manager.create('ctx', makeStack())
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      manager.addListener('ctx', cb1)
      const unsub2 = manager.addListener('ctx', cb2)
      unsub2()
      manager.notifyListeners('ctx', '/new', '/', makeNavInfo(1))
      expect(cb1).toHaveBeenCalledTimes(1)
      expect(cb2).not.toHaveBeenCalled()
    })

    it('addListener throws for non-existent context', () => {
      expect(() => manager.addListener('ctx', vi.fn())).toThrow('[VirtualStackManager]')
    })

    it('notifyListeners is a no-op for non-existent context', () => {
      expect(() => manager.notifyListeners('ctx', '/', '/', makeNavInfo(1))).not.toThrow()
    })
  })
})
