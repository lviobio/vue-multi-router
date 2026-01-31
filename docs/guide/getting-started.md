# Getting Started

## Installation

::: code-group

```bash [npm]
npm install vue-multi-router
```

```bash [pnpm]
pnpm add vue-multi-router
```

```bash [yarn]
yarn add vue-multi-router
```

:::

## Prerequisites

vue-multi-router requires:

- Vue 3.5.0+
- Vue Router 4.0.0+

## Basic Setup

### 1. Create the Multi-Router

Replace your standard Vue Router setup with `createMultiRouter`:

```typescript
// router.ts
import { createMultiRouter } from 'vue-multi-router'
import { createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/dashboard', component: () => import('./views/Dashboard.vue') },
  { path: '/settings', component: () => import('./views/Settings.vue') },
]

export const multiRouter = createMultiRouter({
  history: createWebHistory(),
  routes,
})

export const router = multiRouter.router
```

### 2. Install the Plugin

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

createApp(App)
  .use(router)
  .mount('#app')
```

### 3. Wrap Your App with MultiRouterContext

```vue
<!-- App.vue -->
<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
</script>

<template>
  <MultiRouterContext>
    <RouterView />
  </MultiRouterContext>
</template>
```

### 4. Create Independent Contexts

```vue
<!-- Dashboard.vue -->
<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
</script>

<template>
  <div class="dashboard">
    <MultiRouterContext type="window" name="window-1" initial-location="/settings">
      <RouterView />
    </MultiRouterContext>

    <MultiRouterContext type="window" name="window-2" initial-location="/">
      <RouterView />
    </MultiRouterContext>
  </div>
</template>
```

## Using Context Inside Components

Access the current context's router and route:

```vue
<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { router, route, isActive, activate } = useMultiRouterContext()

function navigateToSettings() {
  router.push('/settings')
}
</script>

<template>
  <div :class="{ active: isActive }">
    <p>Current path: {{ route.path }}</p>
    <button @click="navigateToSettings">Go to Settings</button>
    <button @click="activate">Activate this context</button>
  </div>
</template>
```

## Enabling History Persistence

To persist navigation history across page reloads:

```vue
<MultiRouterContext
  type="window"
  name="my-window"
  :history-enabled="true"
>
  <RouterView />
</MultiRouterContext>
```

## Next Steps

- Understand [History Management](/guide/history) in detail
- Explore the [API Reference](/api/)
