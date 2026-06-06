import { createWebHistory } from 'vue-router'
import { createMultiRouter } from 'vue-multi-router'

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

export const multiRouter = createMultiRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
