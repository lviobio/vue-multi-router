/**
 * Surface metadata (id + label) — the part PanelHeader needs to render its
 * "→ {label}" move buttons. Kept free of component imports so PanelHeader can
 * depend on it without pulling in the surface renderers, which would form an
 * import cycle (PanelHeader → … → surface components → PanelHeader). The registry
 * that pairs each id with its renderer component lives in surfaces.ts.
 */
export interface SurfaceMeta {
  /** Host id stored on each panel. */
  id: string
  /** Human label, used for the generated "→ {label}" move buttons. */
  label: string
}

export const surfaceMetas: SurfaceMeta[] = [
  { id: 'drawer', label: 'Drawer' },
  { id: 'modal', label: 'Modal' },
]
