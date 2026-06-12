import { type App, inject } from 'vue'
import { createWebHashHistory, createWebHistory } from 'vue-router'
import {
  createMultiRouter,
  type KeyValueStorageAdapter,
  type NavigationInterceptor,
  SessionStorageAdapter,
} from '../../src'
import { createPanels, panelsKey } from './composables/usePanels'

// One storage backend for the whole app — swap for new IndexedDBStorageAdapter()
// and both the router history and the panels move with it. Configured here once
// and reachable everywhere else via the manager's getStorageAdapter().
const storageAdapter = new SessionStorageAdapter()

const routes = [
  {
    path: '/',
    component: () => import('./views/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'demo.home',
        redirect: '/demo/cards',
        meta: { multiRouterRoot: true },
        children: [
          {
            path: 'demo/cards',
            name: 'demo.cards',
            component: () => import('./views/demo/Cards.vue'),
            children: [
              {
                path: 'wrapper',
                name: 'demo.cards.wrapper',
                component: () => import('./views/demo/CardContentWrapper.vue'),
                children: [
                  {
                    path: 'content',
                    name: 'demo.cards.wrapper.content',
                    component: () => import('./views/demo/CardContent.vue'),
                    meta: { multiRouterRoot: true },
                  },
                  {
                    path: 'content-v2',
                    name: 'demo.cards.wrapper.content-v2',
                    component: () => import('./views/demo/CardContentV2.vue'),
                    meta: { multiRouterRoot: true },
                  },
                ],
              },
            ],
          },
          {
            path: 'demo/tabs',
            name: 'demo.tabs',
            component: () => import('./views/demo/Tabs.vue'),
            children: [
              {
                path: 'content',
                name: 'demo.tabs.content',
                component: () => import('./views/demo/TabContent.vue'),
                meta: { multiRouterRoot: true },
              },
            ],
          },
          {
            path: 'demo/peek',
            name: 'demo.peek',
            component: () => import('./views/demo/Peek.vue'),
          },
          {
            path: 'demo/windows',
            name: 'demo.windows',
            component: () => import('./views/demo/Windows.vue'),
          },
          {
            path: 'tasks',
            name: 'tasks',
            component: () => import('./views/demo/TaskPageWrapper.vue'),
            meta: { root: true },
            children: [
              {
                path: ':id',
                name: 'tasks.show',
                component: () => import('./views/demo/TaskPage.vue'),
                meta: { multiRouterRoot: true },
              },
            ],
          },
        ],
      },
    ],
  },
]

// `router.push({ name, params, panel })` opens that route as a new panel (window)
// instead of navigating the calling context (see vue-router.d.ts for the `panel`
// flag). `panel: '<surfaceId>'` forces a surface; `panel: true` inherits the
// surface of the originating panel (or the drawer when opened from a non-panel
// context such as the main page). The flag is stripped before the panel opens.
const navigationInterceptor: NavigationInterceptor = ({ to, contextKey, manager, app }) => {
  if (!to || typeof to !== 'object' || !to.panel) return
  // Reach the panel API (provided at app.use) from this non-component callback.
  const panels = app.runWithContext(() => inject(panelsKey))
  if (!panels) return
  const location = { ...to }
  const flag = location.panel
  delete location.panel

  let surface = typeof flag === 'string' ? flag : undefined
  if (!surface) {
    const origin = panels.panels.value.find((p) => panels.contextName(p) === contextKey)
    surface = origin?.surface ?? 'drawer'
  }
  return panels.open(location, surface, manager)
}

const base = createMultiRouter({
  history: import.meta.env.PROD
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  historyOptions: {
    contextSwitchMode: 'push',
    storageAdapter,
  },
  routes,
  navigationInterceptor,
})

// Wrap the router plugin so the panel manager is created at app.use time (not at
// module load): once the router is installed, pull the configured storage off the
// manager, namespace it for panels, and provide the panel API.
export const multiRouter = {
  getByContextName: base.getByContextName,
  install(app: App) {
    base.install(app)
    const manager = base.getManager()
    const storage = (manager.getStorageAdapter() as KeyValueStorageAdapter).namespace('panels:')
    app.provide(panelsKey, createPanels(storage))
  },
}
