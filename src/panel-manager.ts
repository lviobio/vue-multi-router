import { nextTick, ref, type Ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { MultiRouterManagerInstance } from './contextManager'
import {
  mapMaybePromise,
  sessionKeyValueStore,
  type KeyValueStore,
  type MaybePromise,
} from './history'

/**
 * One open page instance in a window manager: a routed location hosted by a
 * "surface" (a drawer, a modal/floating window, a future host…), backed by its
 * own router context so many can be open and interacted with at once. `Meta`
 * carries host-specific UI state the library doesn't care about (window
 * geometry, a cached title, …).
 */
export interface Panel<Meta = Record<string, unknown>> {
  /** Stable unique id (`${idPrefix}-1`, …). */
  id: string
  /**
   * Bumped on every surface move. The router-context name is `${id}_${epoch}`,
   * so a move produces a name disjoint from the old one and the two contexts can
   * never collide on the manager's "already registered" guard, whatever order
   * Vue unmounts the old surface's subtree and mounts the new one in.
   */
  epoch: number
  /** Routed location this panel shows (force it as the context's `location`). */
  location: RouteLocationRaw
  /** Host surface id. */
  surface: string
  /** Stacking / focus order; higher is in front / more recently focused. */
  z: number
  /** App-defined per-panel state (geometry, title, …). */
  meta: Meta
}

export interface PanelManagerOptions {
  /**
   * Where to persist the panel list. Defaults to a sessionStorage-backed store.
   * Pass `adapter.namespace(prefix)` to share the router's storage backend.
   */
  storage?: KeyValueStore
  /** Storage key for the panel list. @default 'multiRouterPanels' */
  storageKey?: string
  /** Prefix for generated panel ids. @default 'panel' */
  idPrefix?: string
}

export interface PanelManager<Meta> {
  /** The open panels (reactive). Render each in its own `MultiRouterContext`. */
  readonly panels: Ref<Panel<Meta>[]>
  /** Router-context name for a panel — `${id}_${epoch}`. */
  contextName(panel: Panel<Meta>): string
  /** Open a new panel on `surface` and make it the active (URL-owning) context. */
  open(
    location: RouteLocationRaw,
    surface: string,
    meta: Meta,
    manager: MultiRouterManagerInstance,
  ): Promise<string>
  /**
   * Move a panel to another surface. One atomic mutation (surface + epoch + raise)
   * so the old/new contexts swap in a single render flush; afterwards re-asserts
   * activation if the panel owned the URL (the old context's unregister briefly
   * falls activation back elsewhere).
   */
  moveTo(id: string, surface: string, manager: MultiRouterManagerInstance): Promise<void>
  /** Close a panel. The manager hands activation back to the previously-active context. */
  close(id: string): void
  /** Raise a panel to the front, and (if a manager is given) make it active. */
  focus(id: string, manager?: MultiRouterManagerInstance): void
  /** Merge into a panel's `meta`. Pass `{ persist: false }` for hot paths (drag). */
  update(id: string, meta: Partial<Meta>, opts?: { persist?: boolean }): void
  /**
   * Persist the routed location a panel currently shows, so in-panel navigation
   * (editing fields, following links) survives reload. This is the *stored* value
   * only — it does not re-force the live context (which would remount it); feed
   * the captured initial location to the context's `location` prop and call this
   * from its `update:location` to keep the persisted copy current.
   */
  setLocation(id: string, location: RouteLocationRaw): void
  /** Whether `id` was restored from storage at creation (use to skip enter animations). */
  wasRestored(id: string): boolean
  /** Forget the restored set, once the first render has settled. */
  clearRestored(): void
}

/**
 * A persisted collection of {@link Panel}s for building a "window manager" on top
 * of multi-router: pages that can be opened, moved between host surfaces, focused
 * and closed, each its own router context. The library owns the *state*
 * (collection, persistence, id/z derivation, activation hand-off); you own the
 * *rendering* (a component per surface) and the per-panel `Meta`.
 *
 * Ids and z are derived from the currently-open panels rather than from standing
 * counters, so closing reclaims slots — close everything and the next panel is
 * `${idPrefix}-1` again. `max + 1` is always greater than every open panel's
 * number, so a reused id can never collide with a still-open context.
 *
 * Like {@link createContextStack}, the `manager` is passed per call (the manager
 * is typically created separately) and Vue reactivity drives rendering.
 */
export function createPanelManager<Meta = Record<string, unknown>>(
  options: PanelManagerOptions = {},
): PanelManager<Meta> {
  const storage = options.storage ?? sessionKeyValueStore
  const storageKey = options.storageKey ?? 'multiRouterPanels'
  const idPrefix = options.idPrefix ?? 'panel'

  const panels = ref<Panel<Meta>[]>([]) as Ref<Panel<Meta>[]>
  // Panels present at load were restored from a previous session; track them so
  // the renderer can paint them already-open (no enter animation) on the first
  // frame. One-shot — cleared via clearRestored once that first render settles.
  const restoredIds = new Set<string>()

  function read(): MaybePromise<Panel<Meta>[]> {
    try {
      return mapMaybePromise(storage.getItem(storageKey), (raw) => {
        if (!raw) return []
        const parsed = JSON.parse(raw) as { panels?: Panel<Meta>[] }
        const list = Array.isArray(parsed?.panels) ? parsed.panels : []
        // Re-pack z to 0..n-1 so it can't grow unbounded across reloads.
        ;[...list].sort((a, b) => a.z - b.z).forEach((p, i) => (p.z = i))
        return list
      })
    } catch {
      return []
    }
  }

  // Hydrate: synchronous stores populate immediately (so module-level creation is
  // ready before the first render); async stores populate reactively after load.
  mapMaybePromise(read(), (list) => {
    panels.value = list
    list.forEach((p) => restoredIds.add(p.id))
  })

  function persist() {
    try {
      const result = storage.setItem(storageKey, JSON.stringify({ panels: panels.value }))
      if (result instanceof Promise) {
        result.catch((e) => console.warn('[PanelManager] persist failed:', e))
      }
    } catch (e) {
      console.warn('[PanelManager] persist failed:', e)
    }
  }

  const contextName = (panel: Panel<Meta>) => `${panel.id}_${panel.epoch}`
  const find = (id: string) => panels.value.find((p) => p.id === id)

  const idNum = (id: string) => Number(id.slice(idPrefix.length + 1)) || 0
  const nextId = () =>
    `${idPrefix}-${panels.value.reduce((m, p) => Math.max(m, idNum(p.id)), 0) + 1}`
  const topZ = () => panels.value.reduce((m, p) => Math.max(m, p.z), 0)
  const nextZ = () => topZ() + 1

  async function open(
    location: RouteLocationRaw,
    surface: string,
    meta: Meta,
    manager: MultiRouterManagerInstance,
  ): Promise<string> {
    const panel: Panel<Meta> = { id: nextId(), epoch: 1, location, surface, z: nextZ(), meta }
    panels.value.push(panel)
    persist()
    // Let the new context register before claiming activation (it owns the URL).
    await nextTick()
    const name = contextName(panel)
    if (manager.has(name)) manager.setActive(name, true)
    return panel.id
  }

  async function moveTo(id: string, surface: string, manager: MultiRouterManagerInstance) {
    const panel = find(id)
    if (!panel || panel.surface === surface) return
    const wasActive = manager.getActiveContext()?.key === contextName(panel)
    panel.surface = surface
    panel.epoch += 1
    panel.z = nextZ()
    persist()
    await nextTick()
    const name = contextName(panel)
    if (wasActive && manager.has(name)) manager.setActive(name, true)
  }

  function close(id: string) {
    const idx = panels.value.findIndex((p) => p.id === id)
    if (idx < 0) return
    panels.value.splice(idx, 1)
    persist()
  }

  function focus(id: string, manager?: MultiRouterManagerInstance) {
    const panel = find(id)
    if (!panel) return
    if (panel.z < topZ()) {
      panel.z = nextZ()
      persist()
    }
    const name = contextName(panel)
    if (manager && manager.has(name)) manager.setActive(name, true)
  }

  function update(id: string, meta: Partial<Meta>, opts?: { persist?: boolean }) {
    const panel = find(id)
    if (!panel) return
    panel.meta = { ...panel.meta, ...meta }
    if (opts?.persist !== false) persist()
  }

  function setLocation(id: string, location: RouteLocationRaw) {
    const panel = find(id)
    if (!panel || panel.location === location) return
    panel.location = location
    persist()
  }

  return {
    panels,
    contextName,
    open,
    moveTo,
    close,
    focus,
    update,
    setLocation,
    wasRestored: (id: string) => restoredIds.has(id),
    clearRestored: () => restoredIds.clear(),
  }
}
