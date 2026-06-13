import { inject, type InjectionKey, type Ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  createPanelManager,
  type KeyValueStore,
  type MultiRouterManagerInstance,
  type Panel as LibPanel,
} from '../../../src'

/**
 * A surface may provide this so a panel's close button animates the host out
 * (e.g. the drawer slides closed) before the panel is dropped. Surfaces that
 * don't (floating windows) leave it unset and PanelHeader closes immediately.
 */
export const panelCloseKey: InjectionKey<() => void> = Symbol('panel-close')

/** Floating-window geometry (used by the modal surface). */
export interface PanelRect {
  x: number
  y: number
  w: number
}

/** Per-panel UI state this playground attaches to each panel. */
export interface PanelMeta {
  rect: PanelRect
  /** Cached title from the routed content, for the host header. */
  title?: string
}

/** A panel here is a library panel carrying our rect + title meta. */
export type Panel = LibPanel<PanelMeta>

/** The playground's panel API: the library panel manager plus rect/title sugar. */
export interface PlaygroundPanels {
  panels: Ref<Panel[]>
  contextName: (panel: Panel) => string
  /** The panel that currently owns the active router context, or null if none does. */
  current: (manager: MultiRouterManagerInstance) => Panel | null
  /** The panel hosted in the given router context, or null if that context isn't a panel. */
  byContextKey: (contextKey: string) => Panel | null
  open: (
    location: RouteLocationRaw,
    surface: string,
    manager: MultiRouterManagerInstance,
  ) => Promise<string>
  moveTo: (id: string, surface: string, manager: MultiRouterManagerInstance) => Promise<void>
  close: (id: string) => void
  focus: (id: string, manager?: MultiRouterManagerInstance) => void
  setRect: (id: string, rect: Partial<PanelRect>, opts?: { persist?: boolean }) => void
  setTitle: (id: string, title: string | undefined) => void
  wasRestored: (id: string) => boolean
  clearRestored: () => void
}

/** Injection key for the panel API, provided once at app.use (see router.ts). */
export const panelsKey: InjectionKey<PlaygroundPanels> = Symbol('panels')

/**
 * Build the panel API over a storage backend. Called once, at install time
 * (`app.use(multiRouter)`), with the storage the router was configured with —
 * so panels persist through the same backend, namespaced away from its keys.
 * The window manager itself lives in the library (createPanelManager); this adds
 * the playground-specific bits (default window position, rect/title setters).
 */
export function createPanels(storage: KeyValueStore): PlaygroundPanels {
  const pm = createPanelManager<PanelMeta>({ storage })
  const find = (id: string) => pm.panels.value.find((p) => p.id === id)

  // Cascade new modal windows so they don't perfectly overlap.
  const defaultRect = (): PanelRect => {
    const n = pm.panels.value.filter((p) => p.surface === 'modal').length
    return { x: 140 + (n % 6) * 30, y: 96 + (n % 6) * 30, w: 460 }
  }

  return {
    panels: pm.panels,
    contextName: pm.contextName,
    current: (manager) => {
      const key = manager.getActiveContext()?.key
      if (!key) return null
      return pm.panels.value.find((p) => pm.contextName(p) === key) ?? null
    },
    byContextKey: (contextKey) =>
      pm.panels.value.find((p) => pm.contextName(p) === contextKey) ?? null,
    open: (location, surface, manager) =>
      pm.open(location, surface, { rect: defaultRect() }, manager),
    moveTo: pm.moveTo,
    close: pm.close,
    focus: pm.focus,
    setRect: (id, rect, opts) => {
      const panel = find(id)
      if (panel) pm.update(id, { rect: { ...panel.meta.rect, ...rect } }, opts)
    },
    setTitle: (id, title) => {
      const panel = find(id)
      if (panel && panel.meta.title !== title) pm.update(id, { title })
    },
    wasRestored: pm.wasRestored,
    clearRestored: pm.clearRestored,
  }
}

/** The panel API, from component setup. Provided at app.use (see router.ts). */
export function usePanels(): PlaygroundPanels {
  const panels = inject(panelsKey)
  if (!panels) {
    throw new Error('[usePanels] panels not provided — is app.use(multiRouter) installed?')
  }
  return panels
}
