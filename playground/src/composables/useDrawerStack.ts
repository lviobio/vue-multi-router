import { createContextStack } from '../../../src'

/** Name of the app-level drawer router context (see AppDrawer.vue). */
export const DRAWER_CONTEXT = 'drawer'

/**
 * The app drawer is a stack of nested router contexts (`drawer`, `drawer-1`, …):
 * the base task lives in `drawer`, each related task peeked from depth d stacks
 * as `drawer-${d + 1}`. A single shared instance backs the navigation
 * interceptor (router.ts) and the rendering components (AppDrawerContent,
 * DrawerLevel). When the whole drawer closes, activation returns to `main`.
 */
const drawerStack = createContextStack({ name: DRAWER_CONTEXT, fallbackContext: 'main' })

export function useDrawerStack() {
  return drawerStack
}
