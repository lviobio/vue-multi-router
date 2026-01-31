import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { createMemoryHistory } from 'vue-router'
import { createMultiRouter } from '../../../src'
import './custom.css'

// Demo components
import CardsDemo from './components/CardsDemo.vue'

// Create multi-router for demos (uses memory history to not conflict with VitePress)
const multiRouter = createMultiRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
  ],
})

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Install multi-router plugin
    app.use(multiRouter)

    // Register demo components
    app.component('CardsDemo', CardsDemo)
  },
} satisfies Theme
