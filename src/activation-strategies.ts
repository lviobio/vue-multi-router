/**
 * Context provided to the activation strategy by the context manager.
 * Allows the strategy to trigger deferred activation logic.
 */
export interface ActivationStrategyContext {
  /** Execute the final activation logic (choose which context to activate) */
  resolveActivation(): void
}

/**
 * Strategy interface for controlling how the active context is chosen
 * during application startup.
 *
 * - **ImmediateActivationStrategy** (default): each context tries to activate
 *   as soon as its router is ready — the current behavior.
 * - **StabilizationActivationStrategy**: waits until no new contexts have been
 *   registered for a configurable delay, then runs the activation logic once.
 *   Useful when `<MultiRouterContext>` components live inside `<Suspense>` boundaries.
 */
export interface ActivationStrategy {
  /**
   * Called when a context has been registered and its router is ready.
   *
   * @returns `true` if the context manager should run immediate (per-context)
   *          activation logic; `false` if the strategy will handle activation
   *          itself (e.g. after a debounce timer).
   */
  onContextReady(contextKey: string): boolean

  /**
   * Called when a context is being unregistered.
   */
  onContextRemoved(contextKey: string): void

  /** Release any resources (timers, etc.) */
  dispose(): void
}

/**
 * Factory function type for creating an activation strategy.
 * The factory receives the {@link ActivationStrategyContext} so the strategy
 * can call `resolveActivation()` when it decides the app is ready.
 */
export type ActivationStrategyFactory = (context: ActivationStrategyContext) => ActivationStrategy

// ---------------------------------------------------------------------------
// Built-in strategies
// ---------------------------------------------------------------------------

/**
 * Default strategy — does nothing special.
 * Each context attempts activation immediately when its router becomes ready.
 * This preserves the original behaviour of the library.
 */
export class ImmediateActivationStrategy implements ActivationStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onContextReady(contextKey: string): boolean {
    // Signal the context manager to run its per-context activation logic right away
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onContextRemoved(contextKey: string): void {}

  dispose(): void {}
}

/**
 * Debounce-based strategy for apps that use `<Suspense>`.
 *
 * After every `onContextReady` call the timer is reset. When the timer
 * finally fires (no new contexts registered within `delay` ms) the strategy
 * calls `resolveActivation()` which picks the best context to activate:
 *
 * 1. The previously-saved context from sessionStorage (if it exists now).
 * 2. The context marked with `default: true`.
 * 3. The last registered context.
 * 4. Any registered context.
 */
export class StabilizationActivationStrategy implements ActivationStrategy {
  private timer: ReturnType<typeof setTimeout> | null = null
  private _stabilized = false

  constructor(
    private readonly delay: number,
    private readonly context: ActivationStrategyContext,
  ) {}

  /** Whether the stabilization period has ended */
  get stabilized(): boolean {
    return this._stabilized
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onContextReady(contextKey: string): boolean {
    if (this._stabilized) {
      // After stabilization new contexts don't restart the timer —
      // they are handled by the user (e.g. via setActive after nextTick).
      return false
    }

    this.scheduleStabilization()
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onContextRemoved(contextKey: string): void {}

  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private scheduleStabilization(): void {
    if (this.timer) clearTimeout(this.timer)

    this.timer = setTimeout(() => {
      this._stabilized = true
      this.timer = null
      this.context.resolveActivation()
    }, this.delay)
  }
}

// ---------------------------------------------------------------------------
// Convenience factory helpers
// ---------------------------------------------------------------------------

/**
 * Factory that creates the default immediate activation strategy.
 *
 * @example
 * ```ts
 * createMultiRouter({
 *   history: createWebHistory(),
 *   routes,
 *   activationStrategy: immediateActivation(),
 * })
 * ```
 */
export function immediateActivation(): ActivationStrategyFactory {
  return () => new ImmediateActivationStrategy()
}

/**
 * Factory that creates a stabilization (debounce) activation strategy.
 *
 * @param delay - Debounce delay in milliseconds (default: `100`).
 *
 * @example
 * ```ts
 * createMultiRouter({
 *   history: createWebHistory(),
 *   routes,
 *   activationStrategy: stabilizationActivation(150),
 * })
 * ```
 */
export function stabilizationActivation(delay = 100): ActivationStrategyFactory {
  return (context) => new StabilizationActivationStrategy(delay, context)
}
