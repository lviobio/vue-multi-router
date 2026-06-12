import 'vue-router'

export {}

declare module 'vue-router' {
  interface RouteLocationOptions {
    /**
     * Open this navigation as a new panel (window) instead of navigating the
     * current context. A string picks the host surface ('drawer' | 'modal' | …);
     * `true` inherits the originating panel's surface (or the drawer when opened
     * from a non-panel context). Handled by the `navigationInterceptor` in
     * router.ts.
     */
    panel?: boolean | string
  }
}
