import { createWebHashHistory, createWebHistory } from 'vue-router'
import { createMultiRouter, type NavigationInterceptor } from '../../src'
import { useDrawerStack } from './composables/useDrawerStack'

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
            path: 'demo/drawer',
            name: 'demo.drawer',
            component: () => import('./views/demo/DrawerDemo.vue'),
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

// `router.push({ name, params, drawer: true })` opens that route in the shared app
// drawer instead of the calling context (see vue-router.d.ts for the `drawer` flag).
// Pushed from outside the drawer → opens the base drawer; from within a drawer →
// stacks the route as a nested drawer on top. The drawer flag is stripped before
// re-navigating so the drawer's own router push isn't intercepted again.
const drawerStack = useDrawerStack()
const navigationInterceptor: NavigationInterceptor = ({ to, contextKey, manager }) => {
  if (!to || typeof to !== 'object' || !to.drawer) return
  const location = { ...to }
  delete location.drawer
  return drawerStack.checkContext(contextKey)
    ? drawerStack.stackTo(drawerStack.depthOf(contextKey), location, manager)
    : drawerStack.openBase(location, manager)
}

export const multiRouter = createMultiRouter({
  history: import.meta.env.PROD
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  historyOptions: {
    contextSwitchMode: 'push',
  },
  routes,
  navigationInterceptor,
})
