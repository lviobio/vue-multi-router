import { nextTick, ref, type Ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { MultiRouterManagerInstance } from './contextManager'

export interface ContextStackOptions {
  /**
   * Base router-context name. Stacked levels are nested contexts named
   * `name`, `name-1`, `name-2`, … where the suffix is the nesting depth.
   */
  name: string
  /**
   * Context that regains activation (and the browser URL) when the whole stack
   * is closed via {@link ContextStack.close}.
   */
  fallbackContext: string
}

export interface ContextStack {
  /**
   * The open stack: `chain[d]` is the forced location of the level stacked on
   * top of depth `d` (context `name-${d + 1}`), or `null` while it restores from
   * its own persisted history after a reload. In-memory only — per-level state
   * persists through each context's `keepHistory`, and the depth is re-seeded
   * from the library's stored active context.
   */
  readonly chain: Ref<(RouteLocationRaw | null)[]>
  /** Whether `key` belongs to this stack (the base `name` or a `name-<n>` level). */
  checkContext(key: string): boolean
  /** Nesting depth of `key` (0 for the base context, N for `name-N`). */
  depthOf(key: string | null): number
  /** Context name stacked on top of `depth` (`depth < 0` → the base context). */
  contextName(depth: number): string
  /** Re-seed the stack depth from the deepest stored-active context. Runs once. */
  seed(manager: MultiRouterManagerInstance): void
  /**
   * Whether storage says a context of this stack was the active (or last-active)
   * one — use to paint the stack open on the first frame after a reload, before
   * the async restore makes activation reactive.
   */
  isRestoredActive(manager: MultiRouterManagerInstance): boolean
  /** Open fresh content in the base context, dropping any stacked levels. */
  openBase(location: RouteLocationRaw, manager: MultiRouterManagerInstance): Promise<void>
  /** Stack `location` on top of `depth`, as context `name-${depth + 1}`. */
  stackTo(
    depth: number,
    location: RouteLocationRaw,
    manager: MultiRouterManagerInstance,
  ): Promise<void>
  /** Close the topmost stacked level (no-op when only the base is open). */
  closeTop(manager: MultiRouterManagerInstance): void
  /** Truncate the stack to `depth` levels — follows browser back/forward. */
  closeTo(depth: number, manager: MultiRouterManagerInstance): void
  /** Close the whole stack, handing activation back to `fallbackContext`. */
  close(manager: MultiRouterManagerInstance): void
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Manages a stack of nested router contexts that open on top of one another —
 * stacked drawers, nested modals, master/detail panels, … Each level is an
 * independent context named `name`, `name-1`, `name-2`, …; the in-memory
 * {@link ContextStack.chain} drives which levels are mounted, while each level's
 * own task persists through `keepHistory` so the stack survives a reload.
 *
 * Closing a level (whether by user action or browser back/forward) drops its
 * persisted history, so `keepHistory` contexts don't leave orphaned storage
 * behind once they're deliberately closed.
 *
 * Create one stack per entity and share that instance across the consumers that
 * drive it (e.g. a navigation interceptor and the rendering components).
 */
export function createContextStack(options: ContextStackOptions): ContextStack {
  const { name, fallbackContext } = options
  const levelPattern = new RegExp(`^${escapeRegExp(name)}-(\\d+)$`)

  const chain = ref<(RouteLocationRaw | null)[]>([])
  let seeded = false

  const contextName = (depth: number) => (depth < 0 ? name : `${name}-${depth + 1}`)
  const isStackContext = (key: string) => key === name || key.startsWith(`${name}-`)
  const depthOf = (key: string | null): number => {
    if (!key || key === name) return 0
    const match = levelPattern.exec(key)
    return match ? Number(match[1]) : 0
  }

  function seed(manager: MultiRouterManagerInstance) {
    if (seeded) return
    seeded = true
    const last = manager.getHistoryManager().getLastActiveContextKey()
    const deepest = typeof last === 'string' && isStackContext(last) ? last : null
    chain.value = Array.from({ length: depthOf(deepest) }, () => null)
  }

  function isRestoredActive(manager: MultiRouterManagerInstance): boolean {
    const history = manager.getHistoryManager()
    const last = history.getLastActiveContextKey()
    return (
      isStackContext(history.getActiveHistoryContextKey() ?? '') ||
      (typeof last === 'string' && isStackContext(last))
    )
  }

  /**
   * Drop the persisted virtual stacks of the given contexts. They use
   * keepHistory, so the library keeps their stored stack on unregister (for
   * reload restore) — which orphans it when a level is deliberately closed.
   * Waits for the levels to unmount first, so storage doesn't accumulate dead
   * entries.
   */
  async function dropStored(contextKeys: string[], manager: MultiRouterManagerInstance) {
    if (contextKeys.length === 0) return
    await nextTick()
    const history = manager.getHistoryManager()
    contextKeys.forEach((key) => history.clearStoredContextHistory(key))
  }

  /**
   * Replace the open stack. Any level that falls off the end (index ≥ the new
   * length) is closed, so its persisted stack is dropped too. Levels that merely
   * change location keep their slot — their stored stack is overwritten on save.
   */
  function setChain(next: (RouteLocationRaw | null)[], manager: MultiRouterManagerInstance) {
    const closed = chain.value.slice(next.length).map((_, i) => contextName(next.length + i))
    chain.value = next
    void dropStored(closed, manager)
  }

  async function openBase(location: RouteLocationRaw, manager: MultiRouterManagerInstance) {
    setChain([], manager)
    // Navigate while the base is inactive (only updates its virtual stack), then
    // activate — one browser entry for the opened route, so back closes it.
    await manager.getRouter(name).push(location)
    manager.setActive(name, true)
  }

  async function stackTo(
    depth: number,
    location: RouteLocationRaw,
    manager: MultiRouterManagerInstance,
  ) {
    setChain([...chain.value.slice(0, depth), location], manager)
    // Let the new level render + register, then activate it so it owns the URL.
    await nextTick()
    const childKey = contextName(depth)
    if (manager.has(childKey)) manager.setActive(childKey, true)
  }

  function closeTop(manager: MultiRouterManagerInstance) {
    if (chain.value.length > 0) setChain(chain.value.slice(0, -1), manager)
  }

  function closeTo(depth: number, manager: MultiRouterManagerInstance) {
    if (depth < chain.value.length) setChain(chain.value.slice(0, depth), manager)
  }

  function close(manager: MultiRouterManagerInstance) {
    setChain([], manager) // drops the stacked levels
    manager.setActive(fallbackContext, true)
    void dropStored([name], manager) // the base context closes too
  }

  return {
    chain,
    checkContext: isStackContext,
    depthOf,
    contextName,
    seed,
    isRestoredActive,
    openBase,
    stackTo,
    closeTop,
    closeTo,
    close,
  }
}
