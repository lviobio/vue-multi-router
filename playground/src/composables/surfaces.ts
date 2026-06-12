import type { Component } from 'vue'
import { surfaceMetas, type SurfaceMeta } from './surface-meta'
import DrawerSurface from '../views/panels/DrawerSurface.vue'
import ModalSurface from '../views/panels/ModalSurface.vue'

/**
 * The surface render registry: each surface's metadata (see surface-meta.ts)
 * paired with the component that draws its panels. Consumed by PanelSurfaces.
 * Add a surface by adding its metadata in surface-meta.ts and its renderer in the
 * map below.
 */
export interface Surface extends SurfaceMeta {
  /** Renderer that draws the panels assigned to this surface. */
  component: Component
}

const renderers: Record<string, Component> = {
  drawer: DrawerSurface,
  modal: ModalSurface,
}

export const surfaces: Surface[] = surfaceMetas.map((meta) => ({
  ...meta,
  component: renderers[meta.id],
}))
