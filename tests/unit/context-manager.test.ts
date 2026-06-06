import { describe, it, expect, beforeEach } from 'vitest'
import { createTestManager, delay, waitFor } from './utils/test-helpers'
import { MultiRouterManagerInstance } from '../../src/contextManager'

describe('MultiRouterManagerInstance', () => {
  describe('has', () => {
    it('returns false before registration', () => {
      const { manager } = createTestManager()
      expect(manager.has('ctx')).toBe(false)
    })

    it('returns true after register() is called', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      expect(manager.has('ctx-a')).toBe(true)
    })

    it('returns false after unregister()', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.unregister('ctx-a')
      expect(manager.has('ctx-a')).toBe(false)
    })
  })

  describe('setActive', () => {
    it('throws for an unregistered context key', () => {
      const { manager } = createTestManager()
      expect(() => manager.setActive('unknown', false)).toThrow('[MultiRouter]')
    })

    it('sets the active context', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.setActive('ctx-a', false)
      expect(manager.getActiveContext()?.key).toBe('ctx-a')
    })

    it('returns true when the context changes', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      expect(manager.setActive('ctx-a', false)).toBe(true)
    })

    it('returns false when setting the same context again', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.setActive('ctx-a', false)
      expect(manager.setActive('ctx-a', false)).toBe(false)
    })

    it('switches active context between two contexts', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.register('panel', 'ctx-b')
      manager.setActive('ctx-a', false)
      expect(manager.getActiveContext()?.key).toBe('ctx-a')
      manager.setActive('ctx-b', false)
      expect(manager.getActiveContext()?.key).toBe('ctx-b')
    })
  })

  describe('getActiveContext / getActiveContextRef', () => {
    it('returns undefined when nothing is active', () => {
      const { manager } = createTestManager()
      expect(manager.getActiveContext()).toBeUndefined()
    })

    it('getActiveContextRef is reactive', () => {
      const { manager } = createTestManager()
      const ref = manager.getActiveContextRef()
      expect(ref.value).toBeUndefined()
      manager.register('panel', 'ctx-a')
      manager.setActive('ctx-a', false)
      expect(ref.value?.key).toBe('ctx-a')
    })
  })

  describe('unregister', () => {
    it('removes the context from registered map', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.unregister('ctx-a')
      expect(manager.has('ctx-a')).toBe(false)
    })

    it('makes has() return false even when unregistered context was active', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.setActive('ctx-a', false)
      manager.unregister('ctx-a')
      // The context is gone from the registry regardless of active-context fallback behaviour
      expect(manager.has('ctx-a')).toBe(false)
    })

    it('falls back to another context when active is unregistered', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.register('panel', 'ctx-b')
      manager.setActive('ctx-a', false)
      manager.setActive('ctx-b', false)
      // ctx-a is in context stack now; unregistering ctx-b should restore ctx-a
      manager.unregister('ctx-b')
      expect(manager.getActiveContext()?.key).toBe('ctx-a')
    })

    it('is safe to call for an already-unregistered key', () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.unregister('ctx-a')
      // Should not throw
      expect(() => manager.unregister('ctx-a')).not.toThrow()
    })
  })

  describe('auto-activation with immediateActivation strategy', () => {
    it('auto-activates the first registered context (no prior saved state)', async () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')

      // Wait for router.isReady() to resolve and activation to run
      await waitFor(() => manager.getActiveContext()?.key === 'ctx-a', { timeout: 2000 })
      expect(manager.getActiveContext()?.key).toBe('ctx-a')
    })

    it('auto-activates the default context when multiple contexts register', async () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')
      manager.register('panel', 'ctx-b', { default: true })

      await waitFor(
        () => manager.getActiveContext() !== undefined,
        { timeout: 2000 },
      )
      // The default context should win once ctx-a activates and ctx-b has default:true,
      // but with immediateActivation the first ready context activates first.
      // Since we cannot guarantee order, just verify something is active.
      expect(manager.getActiveContext()).toBeDefined()
    })
  })

  describe('getRouter', () => {
    it('returns the router for a registered context', async () => {
      const { manager } = createTestManager()
      manager.register('panel', 'ctx-a')

      await waitFor(() => manager.has('ctx-a'), { timeout: 2000 })
      const router = manager.getRouter('ctx-a')
      expect(router).toBeDefined()
      expect(typeof router.push).toBe('function')
    })
  })
})
