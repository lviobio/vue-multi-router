import { createWebHashHistory, createWebHistory } from 'vue-router'
import { createMultiRouter } from '../../src'

const routes = [
  {
    path: '/',
    component: () => import('./views/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'demo.home',
        redirect: '/demo/cards',
      },
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
    ],
  },
  {
    // Standalone task page. Used as the "peek-drawer" context location (rendered
    // inside the drawer) and as a regular page when the link is opened directly.
    path: '/task/:id?',
    name: 'task',
    component: () => import('./views/demo/PeekTaskView.vue'),
    meta: { multiRouterRoot: true },
  },
]

export const multiRouter = createMultiRouter({
  history: import.meta.env.PROD
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  historyOptions: {
    contextSwitchMode: 'push',
  },
  routes,
})
