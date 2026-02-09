import type { ActivationStrategyFactory } from '@/activation-strategies'
import { MultiRouterManagerInstance } from '@/contextManager'
import type { MultiRouterHistoryManagerOptions } from '@/history'
import { multiRouterContextManagerKey, multiRouterOriginalDepthKey } from '@/injectionSymbols'
import { multiRouterContext } from '@/symbols'
import {
  type App,
  type ComponentInternalInstance,
  computed,
  getCurrentInstance as _getCurrentInstance,
} from 'vue'
import {
  createRouter,
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

      return computed(() => {
        const originalDepth = originalDepthRef?.value || 0
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
