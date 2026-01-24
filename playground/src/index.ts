import { createApp } from 'vue'
import naive from 'naive-ui'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('./views/MainLayout.vue'),
      children: [
        {
          path: '/',
          name: 'home',
          component: () => import('./views/Home.vue'),
        },
      ],
    },
  ],
})

const app = createApp(App)

app.use(naive)
app.use(router)

app.mount('#app')
