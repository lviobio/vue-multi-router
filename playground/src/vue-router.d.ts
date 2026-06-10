import 'vue-router'

export {}

declare module 'vue-router' {
  interface RouteLocationOptions {
    /**
     * Open this navigation in the shared app drawer instead of the current
     * context. Handled by the `navigationInterceptor` configured in router.ts.
     */
    drawer?: boolean
  }
}
