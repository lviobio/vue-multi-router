import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url)),
      },
    },
  },

  title: 'vue-multi-router',
  description: 'Multiple independent routers for Vue 3 applications',
  lang: 'en-US',

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Playground', link: 'https://lviobio.github.io/vue-multi-router/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is vue-multi-router?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Interactive Demo', link: '/guide/demo' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [{ text: 'History Management', link: '/guide/history' }],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'createMultiRouter', link: '/api/create-multi-router' },
            { text: 'MultiRouterContext', link: '/api/multi-router-context' },
            { text: 'useMultiRouterContext', link: '/api/use-multi-router-context' },
            { text: 'useMultiRouter', link: '/api/use-multi-router' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/lviobio/vue-multi-router' }],

    footer: {
      message: 'Released under the MIT License.',
    },

    search: {
      provider: 'local',
    },
  },
})
