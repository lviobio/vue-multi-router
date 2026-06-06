import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useMultiRouter } from '../../src/composables/useMultiRouter'
import { useMultiRouterContext } from '../../src/composables/useMultiRouterContext'
import { multiRouterContextManagerKey, multiRouterContextKey } from '../../src/injectionSymbols'
import { createTestManager } from './utils/test-helpers'

describe('useMultiRouter', () => {
  it('throws when manager is not provided', () => {
    const Comp = defineComponent({
      setup() {
        useMultiRouter()
        return () => h('div')
      },
    })
    expect(() => mount(Comp)).toThrow('[useMultiRouter]')
  })

  it('returns manager and computed refs when the manager is injected', () => {
    let result: ReturnType<typeof useMultiRouter> | undefined
    const Comp = defineComponent({
      setup() {
        result = useMultiRouter()
        return () => h('div')
      },
    })
    const { manager } = createTestManager()
    mount(Comp, {
      global: { provide: { [multiRouterContextManagerKey as symbol]: manager } },
    })
    expect(result).toBeDefined()
    expect(result!.manager).toBe(manager)
    expect(typeof result!.activeContextKey.value).toBe('undefined') // nothing active yet
    expect(typeof result!.setActive).toBe('function')
    expect(typeof result!.hasContext).toBe('function')
  })

  it('activeContextKey reflects setActive calls', () => {
    let result: ReturnType<typeof useMultiRouter> | undefined
    const Comp = defineComponent({
      setup() {
        result = useMultiRouter()
        return () => h('div')
      },
    })
    const { manager } = createTestManager()
    manager.register('panel', 'ctx-a')
    mount(Comp, {
      global: { provide: { [multiRouterContextManagerKey as symbol]: manager } },
    })
    expect(result!.activeContextKey.value).toBeUndefined()
    manager.setActive('ctx-a', false)
    expect(result!.activeContextKey.value).toBe('ctx-a')
  })

  it('hasContext delegates to manager.has()', () => {
    let result: ReturnType<typeof useMultiRouter> | undefined
    const Comp = defineComponent({
      setup() {
        result = useMultiRouter()
        return () => h('div')
      },
    })
    const { manager } = createTestManager()
    manager.register('panel', 'ctx-a')
    mount(Comp, {
      global: { provide: { [multiRouterContextManagerKey as symbol]: manager } },
    })
    expect(result!.hasContext('ctx-a')).toBe(true)
    expect(result!.hasContext('ctx-missing')).toBe(false)
  })
})

describe('useMultiRouterContext', () => {
  it('throws when no context key is provided', () => {
    const Comp = defineComponent({
      setup() {
        useMultiRouterContext()
        return () => h('div')
      },
    })
    const { manager } = createTestManager()
    expect(() =>
      mount(Comp, {
        global: { provide: { [multiRouterContextManagerKey as symbol]: manager } },
      }),
    ).toThrow('[useMultiRouterContext]')
  })

  it('returns contextKey from injection', () => {
    let result: ReturnType<typeof useMultiRouterContext> | undefined
    const Comp = defineComponent({
      setup() {
        result = useMultiRouterContext()
        return () => h('div')
      },
    })
    const { manager } = createTestManager()
    manager.register('panel', 'ctx-a')
    mount(Comp, {
      global: {
        provide: {
          [multiRouterContextManagerKey as symbol]: manager,
          [multiRouterContextKey as symbol]: 'ctx-a',
        },
      },
    })
    expect(result!.contextKey).toBe('ctx-a')
  })

  it('isActive reflects whether the injected context key is active', () => {
    let result: ReturnType<typeof useMultiRouterContext> | undefined
    const Comp = defineComponent({
      setup() {
        result = useMultiRouterContext()
        return () => h('div')
      },
    })
    const { manager } = createTestManager()
    manager.register('panel', 'ctx-a')
    manager.register('panel', 'ctx-b')
    mount(Comp, {
      global: {
        provide: {
          [multiRouterContextManagerKey as symbol]: manager,
          [multiRouterContextKey as symbol]: 'ctx-a',
        },
      },
    })
    expect(result!.isActive.value).toBe(false)
    manager.setActive('ctx-a', false)
    expect(result!.isActive.value).toBe(true)
    manager.setActive('ctx-b', false)
    expect(result!.isActive.value).toBe(false)
  })

  it('activate() calls setActive with the injected context key', () => {
    let result: ReturnType<typeof useMultiRouterContext> | undefined
    const Comp = defineComponent({
      setup() {
        result = useMultiRouterContext()
        return () => h('div')
      },
    })
    const { manager } = createTestManager()
    manager.register('panel', 'ctx-a')
    mount(Comp, {
      global: {
        provide: {
          [multiRouterContextManagerKey as symbol]: manager,
          [multiRouterContextKey as symbol]: 'ctx-a',
        },
      },
    })
    result!.activate(false)
    expect(manager.getActiveContext()?.key).toBe('ctx-a')
  })
})
