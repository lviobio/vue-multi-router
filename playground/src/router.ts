import { createWebHistory } from 'vue-router'
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
      },
      // {
      //   path: 'demo/cards/content',
      //   name: 'demo.cards.content',
      //   component: () => import('./views/demo/CardContent.vue'),
      //   meta: { multiRouterRoot: { card: true } },
      // },
      {
        path: 'demo/tabs',
        name: 'demo.tabs',
        component: () => import('./views/demo/Tabs.vue'),
      },
      {
        path: 'demo/windows',
        name: 'demo.windows',
        component: () => import('./views/demo/Windows.vue'),
      },
    ],
  },
  // Route for card content - matches any path with query
  {
    path: '/demo/cards/content',
    component: () => import('./views/demo/CardContent.vue'),
  },
]

export const multiRouter = createMultiRouter({
  history: () => createWebHistory(import.meta.env.BASE_URL),
  types: {
    main: { canUseAsHistoryContext: true, single: true },
    card: { canUseAsHistoryContext: false, single: false },
  },
  routes,
})
