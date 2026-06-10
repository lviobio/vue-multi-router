import type { ActivationStrategyFactory } from '@/activation-strategies'
import { MultiRouterManagerInstance } from '@/contextManager'
import type { MultiRouterHistoryManagerOptions } from '@/history'
import {
  multiRouterContextManagerKey,
  multiRouterOriginalDepthContextKey,
  multiRouterOriginalDepthKey,
} from '@/injectionSymbols'
import { multiRouterContext } from '@/symbols'
import {
  type App,
  type ComponentInternalInstance,
  computed,
  getCurrentInstance as _getCurrentInstance,
} from 'vue'
import {
  createRouter,
  type RouteLocationRaw,
  routeLocationKey,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type RouteLocationNormalizedLoadedGeneric,
  type Router,
  type RouterHistory,
  routerKey,
  RouterLink,
  type RouterOptions,
  RouterView,
  routerViewLocationKey,
  viewDepthKey,
} from 'vue-router'

const START_LOCATION_NORMALIZED = {
  path: '/',
  name: undefined,
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
  redirectedFrom: undefined,
}

const getCurrentInstance = () =>
  _getCurrentInstance() as ComponentInternalInstance & {
    provides: any
  }

function installContextAwareRouterResolvers(app: App, contextManager: MultiRouterManagerInstance) {
  if (app._context.provides[routerKey]) {
    throw new Error('Router installed to app, this may cause unexpected behavior')
  }

  function isVueDevtoolsCall(): boolean {
    return !!new Error().stack?.includes('chrome-extension://nhdogjmejiglipccpnnnanhbledajbpd')
  }

  function getInstanceContextKey(): string | null {
    const instance = getCurrentInstance()

    if (!instance) {
      if (isVueDevtoolsCall()) return null
      throw new Error('No instance found')
    }

    const contextKey = instance.provides[multiRouterContext]
    if (!contextKey) {
      throw new Error('Context key not found')
    }

    return contextKey
  }

  const routerProperty = {
    enumerable: true,
    get() {
      const contextKey = getInstanceContextKey()
      if (!contextKey) return null

      if (!contextManager.has(contextKey)) {
        if (isVueDevtoolsCall()) return null
        throw new Error(`Router not found for context ${contextKey}`)
      }

      return contextManager.getRouter(contextKey)
    },
  }

  const routeProperty = {
    enumerable: true,
    get() {
      const contextKey = getInstanceContextKey()
      if (!contextKey || !contextManager.has(contextKey)) return null

      const currentRoute = contextManager.getRouter(contextKey).currentRoute

      const reactiveRoute = {} as RouteLocationNormalizedLoaded
      for (const key in START_LOCATION_NORMALIZED) {
        Object.defineProperty(reactiveRoute, key, {
          get: () => currentRoute.value[key as keyof RouteLocationNormalized],
          enumerable: true,
        })
      }

      return reactiveRoute
    },
  }

  Object.defineProperty(app._context.provides, routerKey, routerProperty)
  Object.defineProperty(app.config.globalProperties, '$router', routerProperty)

  Object.defineProperty(app._context.provides, routeLocationKey, routeProperty)
  Object.defineProperty(app.config.globalProperties, '$route', routeProperty)

  Object.defineProperty(app._context.provides, viewDepthKey, {
    enumerable: true,
    configurable: true,
    get() {
      const instance = getCurrentInstance()
      const originalDepthRef = instance?.provides[multiRouterOriginalDepthKey]
      const depthContextKey = instance?.provides[multiRouterOriginalDepthContextKey]
      const currentContextKey = instance?.provides[multiRouterContext]

      return computed(() => {
        // Ignore depth inherited from a different context — each context starts at 0.
        const originalDepth =
          depthContextKey === currentContextKey ? originalDepthRef?.value || 0 : 0
        // Contexts that opt into rendering the full route tree (the main/shell
        // context) don't collapse to a multiRouterRoot — they show whole pages,
        // layouts and all. Sub-contexts (panels, drawers) still render only the
        // fragment from the deepest multiRouterRoot down.
        if (currentContextKey && contextManager.rendersAsRoot(currentContextKey)) {
          return originalDepth
        }

        const injectedRoute = instance?.provides[routerViewLocationKey]
          .value as RouteLocationNormalizedLoadedGeneric

        const indexOfLastRoot = injectedRoute.matched.findLastIndex(
          (route) => route.meta.multiRouterRoot,
        )

        if (originalDepth < indexOfLastRoot) {
          return indexOfLastRoot
        }

        return originalDepth
      })
    },
    set(value) {
      const instance = getCurrentInstance()

      instance.provides[multiRouterOriginalDepthKey] = value
      instance.provides[multiRouterOriginalDepthContextKey] = instance.provides[multiRouterContext]
    },
  })

  Object.defineProperty(app._context.provides, routerViewLocationKey, {
    enumerable: true,
    configurable: true,
    get() {
      const contextKey = getInstanceContextKey()
      if (!contextKey || !contextManager.has(contextKey)) return null

      return contextManager.getRouter(contextKey).currentRoute
    },
    /**
     * Called by RouterView component
     */
    set() {
      // Do nothing
    },
  })
}

function installComponents(app: App) {
  app.component('RouterLink', RouterLink)
  app.component('RouterView', RouterView)
}

type MultiRouterInterface = {
  getByContextName: (name: string) => Router
  install: (app: App) => void
}

/**
 * Intercepts a navigation before it runs on a context's router. Invoked for every
 * `push`/`replace` with the raw target — so custom `RouteLocationOptions` are still
 * visible (Vue Router strips them before guards see them) — and the calling
 * context. Return a thenable to take over the navigation (the normal push/replace
 * is skipped); return `undefined` to let it proceed as usual. Lets an app route a
 * navigation to a different context (e.g. open it in a drawer) based on its options.
 */
export type NavigationInterceptor = (context: {
  to: RouteLocationRaw
  contextKey: string
  manager: MultiRouterManagerInstance
}) => Promise<unknown> | undefined | void

type CustomRouterOptions = RouterOptions & {
  historyOptions?: MultiRouterHistoryManagerOptions
  /**
   * Strategy for choosing which context to activate during app startup.
   *
   * - `immediateActivation()` (default) — each context tries to activate as
   *   soon as its router is ready (original behaviour).
   * - `stabilizationActivation(delay?)` — waits until no new contexts have
   *   registered for `delay` ms, then picks the best context to activate.
   *   Use this when `<MultiRouterContext>` components are inside `<Suspense>`.
   */
  activationStrategy?: ActivationStrategyFactory
  /** See {@link NavigationInterceptor}. Applied to every context's router. */
  navigationInterceptor?: NavigationInterceptor
}

export function createMultiRouter(options: CustomRouterOptions): MultiRouterInterface {
  let contextManager: MultiRouterManagerInstance

  return {
    getByContextName: (name: string) => {
      return contextManager.getRouter(name)
    },
    install: (app: App) => {
      const makeRouter = (contextKey: string, history: RouterHistory): Router => {
        const router = createRouter({
          ...options,
          history,
        })

        Object.assign(router, { contextKey })

        // Let the app intercept navigations (and read custom location options) on
        // this context's router. A returned thenable takes over; otherwise the
        // original push/replace runs.
        const { navigationInterceptor } = options
        if (navigationInterceptor) {
          const wrap = (original: Router['push']): Router['push'] =>
            ((to) =>
              navigationInterceptor({ to, contextKey, manager: contextManager }) ??
              original(to)) as Router['push']
          router.push = wrap(router.push.bind(router))
          router.replace = wrap(router.replace.bind(router))
        }

        return router
      }

      contextManager = new MultiRouterManagerInstance(
        app,
        { history: options.history, ...options.historyOptions },
        makeRouter,
        options.activationStrategy,
      )
      app.provide(multiRouterContextManagerKey, contextManager)

      installComponents(app)
      installContextAwareRouterResolvers(app, contextManager)
    },
  }
}
