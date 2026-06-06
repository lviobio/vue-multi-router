import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ImmediateActivationStrategy,
  StabilizationActivationStrategy,
  immediateActivation,
  stabilizationActivation,
  type ActivationStrategyContext,
} from '../../src/activation-strategies'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createContext(): ActivationStrategyContext & { resolveActivation: ReturnType<typeof vi.fn> } {
  return { resolveActivation: vi.fn() }
}

describe('ImmediateActivationStrategy', () => {
  let strategy: ImmediateActivationStrategy

  beforeEach(() => {
    strategy = new ImmediateActivationStrategy()
  })

  it('onContextReady always returns true', () => {
    expect(strategy.onContextReady('ctx-a')).toBe(true)
    expect(strategy.onContextReady('ctx-b')).toBe(true)
  })

  it('onContextRemoved does not throw', () => {
    expect(() => strategy.onContextRemoved('ctx-a')).not.toThrow()
  })

  it('dispose does not throw', () => {
    expect(() => strategy.dispose()).not.toThrow()
  })
})

describe('StabilizationActivationStrategy', () => {
  it('onContextReady returns false before stabilization', () => {
    const context = createContext()
    const strategy = new StabilizationActivationStrategy(200, context)
    expect(strategy.onContextReady('ctx-a')).toBe(false)
    strategy.dispose()
  })

  it('starts with stabilized = false', () => {
    const context = createContext()
    const strategy = new StabilizationActivationStrategy(200, context)
    expect(strategy.stabilized).toBe(false)
    strategy.dispose()
  })

  it('calls resolveActivation after delay when no new contexts register', async () => {
    const context = createContext()
    const strategy = new StabilizationActivationStrategy(50, context)

    strategy.onContextReady('ctx-a')
    expect(context.resolveActivation).not.toHaveBeenCalled()

    await delay(100)
    expect(context.resolveActivation).toHaveBeenCalledTimes(1)
    expect(strategy.stabilized).toBe(true)
  })

  it('resets timer when a new context registers before stabilization', async () => {
    const context = createContext()
    const strategy = new StabilizationActivationStrategy(80, context)

    strategy.onContextReady('ctx-a')
    await delay(40)
    strategy.onContextReady('ctx-b')
    await delay(40)
    expect(context.resolveActivation).not.toHaveBeenCalled()

    await delay(60)
    expect(context.resolveActivation).toHaveBeenCalledTimes(1)
    strategy.dispose()
  })

  it('returns false for new contexts after stabilization and does not restart timer', async () => {
    const context = createContext()
    const strategy = new StabilizationActivationStrategy(30, context)

    strategy.onContextReady('ctx-a')
    await delay(60)
    expect(strategy.stabilized).toBe(true)
    expect(context.resolveActivation).toHaveBeenCalledTimes(1)

    context.resolveActivation.mockClear()
    const result = strategy.onContextReady('ctx-b')
    expect(result).toBe(false)
    await delay(60)
    expect(context.resolveActivation).not.toHaveBeenCalled()

    strategy.dispose()
  })

  it('dispose cancels the pending stabilization timer', async () => {
    const context = createContext()
    const strategy = new StabilizationActivationStrategy(50, context)

    strategy.onContextReady('ctx-a')
    strategy.dispose()

    await delay(100)
    expect(context.resolveActivation).not.toHaveBeenCalled()
  })

  it('onContextRemoved does not throw', () => {
    const context = createContext()
    const strategy = new StabilizationActivationStrategy(200, context)
    expect(() => strategy.onContextRemoved('ctx-a')).not.toThrow()
    strategy.dispose()
  })
})

describe('immediateActivation factory', () => {
  it('creates an ImmediateActivationStrategy', () => {
    const factory = immediateActivation()
    const strategy = factory(createContext())
    expect(strategy).toBeInstanceOf(ImmediateActivationStrategy)
  })
})

describe('stabilizationActivation factory', () => {
  it('creates a StabilizationActivationStrategy', () => {
    const factory = stabilizationActivation(200)
    const strategy = factory(createContext())
    expect(strategy).toBeInstanceOf(StabilizationActivationStrategy)
    strategy.dispose()
  })

  it('uses 100ms default delay', async () => {
    const context = createContext()
    const strategy = stabilizationActivation()(context)

    strategy.onContextReady('ctx-a')
    await delay(50)
    expect(context.resolveActivation).not.toHaveBeenCalled()
    await delay(80)
    expect(context.resolveActivation).toHaveBeenCalledTimes(1)
    strategy.dispose()
  })
})
