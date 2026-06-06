import { createWebHistory } from 'vue-router'
import {
  createMultiRouter,
  stabilizationActivation,
  type ContextSwitchMode,
} from 'vue-multi-router'

const routes = [
  {
    path: '/',
    redirect: '/context-switching',
  },
  {
    path: '/context-switching',
    name: 'context-switching',
    component: () => import('./views/ContextSwitching.vue'),
  },
  {
    path: '/basic-navigation',
    name: 'basic-navigation',
    component: () => import('./views/BasicNavigation.vue'),
  },
  {
    path: '/activator',
    name: 'activator',
    component: () => import('./views/ActivatorView.vue'),
  },
  {
    path: '/url-sync',
    name: 'url-sync',
    component: () => import('./views/UrlSync.vue'),
  },
  {
    path: '/dynamic-panels',
    name: 'dynamic-panels',
    component: () => import('./views/DynamicPanels.vue'),
  },
  {
    path: '/activate-hook',
    name: 'activate-hook',
    component: () => import('./views/ActivateHook.vue'),
  },
  {
    path: '/stabilization',
    name: 'stabilization',
    component: () => import('./views/StabilizationView.vue'),
  },
  {
    path: '/edge-cases',
    name: 'edge-cases',
    component: () => import('./views/EdgeCases.vue'),
  },
  {
    path: '/location-control',
    name: 'location-control',
    component: () => import('./views/LocationControl.vue'),
  },
  {
    path: '/nested-host',
    name: 'nested-host',
    component: () => import('./views/NestedHost.vue'),
  },
  {
    path: '/nested',
    component: () => import('./views/nested/NestedLayout.vue'),
    children: [
      {
        path: 'child',
        name: 'nested-child',
        component: () => import('./views/nested/NestedChild.vue'),
        meta: { multiRouterRoot: true },
        children: [
          {
            path: 'deep',
            name: 'nested-deep',
            component: () => import('./views/nested/NestedDeep.vue'),
          },
        ],
      },
      {
        path: 'child-b',
        name: 'nested-child-b',
        component: () => import('./views/nested/NestedChildB.vue'),
        meta: { multiRouterRoot: true },
      },
    ],
  },
  {
    path: '/page-a',
    name: 'panel-page-a',
    component: () => import('./views/PageA.vue'),
    meta: { multiRouterRoot: true },
  },
  {
    path: '/page-b',
    name: 'panel-page-b',
    component: () => import('./views/PageB.vue'),
    meta: { multiRouterRoot: true },
  },
  {
    path: '/query-page',
    name: 'panel-query-page',
    component: () => import('./views/QueryPage.vue'),
    meta: { multiRouterRoot: true },
  },
]

// Specs can exercise non-default context switch modes via
// page.addInitScript(() => sessionStorage.setItem('e2e-switch-mode', 'push' /* or 'none' */))
const contextSwitchMode =
  (sessionStorage.getItem('e2e-switch-mode') as ContextSwitchMode | null) ?? 'replace'

// Specs can opt into the stabilization activation strategy via
// page.addInitScript(() => sessionStorage.setItem('e2e-activation-strategy', 'stabilization'))
const activationStrategy =
  sessionStorage.getItem('e2e-activation-strategy') === 'stabilization'
    ? stabilizationActivation(300)
    : undefined

export const multiRouter = createMultiRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  historyOptions: { contextSwitchMode },
  activationStrategy,
  routes,
})
