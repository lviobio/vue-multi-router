# vue-multi-router

Vue 3 Multi Router that allows you to have multiple routers in your application.

[![npm downloads](https://img.shields.io/npm/dm/vue-multi-router.svg)](https://www.npmjs.com/package/vue-multi-router)
[![TypeScript](https://badgen.net/badge/icon/TypeScript?icon=typescript&label)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/vue-multi-router)](https://bundlephobia.com/package/vue-multi-router)
[![GitHub issues](https://img.shields.io/github/issues/lviobio/vue-multi-router)](https://github.com/lviobio/vue-multi-router/issues)
[![GitHub License](https://img.shields.io/github/license/lviobio/vue-multi-router)](https://github.com/lviobio/vue-multi-router)
![CI](https://github.com/lviobio/vue-multi-router/actions/workflows/ci.yml/badge.svg)
![Coverage](https://github.com/lviobio/vue-multi-router/actions/workflows/coverage.yml/badge.svg)
[![codecov](https://codecov.io/gh/lviobio/vue-multi-router/branch/main/graph/badge.svg)](https://codecov.io/gh/lviobio/vue-multi-router)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://lviobio.github.io/vue-multi-router/)

## Live Demo

🚀 **[Try the interactive playground](https://lviobio.github.io/vue-multi-router)**

## Installation

```bash
npm install vue-multi-router
```

## Features

- **Multiple Independent Routers** - Run multiple Vue Router instances simultaneously in a single app
- **Context-Based Navigation** - Each routing context maintains its own navigation history
- **Browser History Integration** - Back/forward buttons work across contexts with proper URL updates
- **Session Persistence** - Context states persist across page reloads via SessionStorage or other implementations
- **TypeScript Support** - Full type definitions included
- **Composable API** - Easy-to-use composables for accessing router state

## Basic Usage

### 1. Create Multi Router

```typescript
// router.ts
import { createMultiRouter } from 'vue-multi-router'
import { createWebHistory } from 'vue-router'

export const multiRouter = createMultiRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./views/Layout.vue'),
      children: [
        { path: 'home', component: () => import('./views/Home.vue') },
        { path: 'about', component: () => import('./views/About.vue') },
      ],
    },
  ],
})
```

### 2. Install Plugin

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { multiRouter } from './router'

const app = createApp(App)
app.use(multiRouter)
app.mount('#app')
```

### 3. Define Contexts

```vue
<!-- App.vue -->
<template>
  <MultiRouterContext type="main" name="main" default>
    <RouterView />
  </MultiRouterContext>
</template>

<script setup>
import { MultiRouterContext } from 'vue-multi-router'
</script>
```

`MultiRouterContext` acts as an activator by default — clicking anywhere inside it activates the context. No extra wrapper needed.

### 4. Create Additional Contexts

```vue
<!-- Panels.vue -->
<template>
  <div v-for="panel in panels" :key="panel.id">
    <MultiRouterContext
      type="panel"
      :name="`panel-${panel.id}`"
      initial-location="/home"
    >
      <RouterView />
    </MultiRouterContext>
  </div>
</template>
```

## API Reference

### `createMultiRouter(options)`

Creates a multi-router instance.

**Options:**
- `history: RouterHistory` - Vue Router history instance
- `routes: RouteRecordRaw[]` - Route definitions (same as Vue Router)
- `historyOptions?: MultiRouterHistoryManagerOptions` - History management options

### Route Meta Options

**`multiRouterRoot: boolean`**

Marks a route as the root for context rendering. When a context navigates to a nested route, `RouterView` inside the context will start rendering from the route marked with `multiRouterRoot: true`, skipping parent routes.

```typescript
const routes = [
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [
      {
        path: 'panels',
        component: PanelsContainer,
        children: [
          {
            path: 'content',
            component: PanelContent,
            meta: { multiRouterRoot: true }, // Context renders from here
          },
        ],
      },
    ],
  },
]
```

This is useful when contexts are nested inside shared layouts but should render independently from their root component.

### `<MultiRouterContext>`

Component that defines a routing context boundary. By default, it also acts as an activator — clicking inside the context activates it.

**Props:**
- `type: string` - Context type identifier (for debugging/organization)
- `name: string` - Unique context identifier
- `location?: string` - Force specific location (overrides storage)
- `initial-location?: string` - Initial location for new contexts
- `history-enabled?: boolean` - Whether to track in browser history (default: `true`)
- `default?: boolean` - Activate by default if no saved context exists
- `activator?: boolean` - Whether to activate context on mousedown (default: `true`). Set to `false` to opt out of built-in activation behavior
- `prevent-class?: string` - CSS class that prevents activation on click, useful if you want to prevent activation on click of a button that destroys the context

To disable the built-in activator:

```vue
<MultiRouterContext type="panel" name="panel-1" :activator="false">
  <!-- manage activation manually -->
</MultiRouterContext>
```

### `<MultiRouterContextActivator>`

Standalone wrapper component that activates context on user interaction. Useful for advanced cases where you need fine-grained control over which element triggers activation, separate from the `MultiRouterContext` boundary.

**Props:**
- `prevent-class?: string` - CSS class that prevents activation on click
- `as?: string` - HTML element to render as wrapper (default: fragment/div)

### `useMultiRouter()`

Composable for accessing multi-router outside a context.

**Returns:**
- `activeContextKey: ComputedRef<string | undefined>` - Currently active context
- `activeHistoryContextKey: ComputedRef<string | undefined>` - Context controlling browser URL
- `setActive(contextKey: string, updateHistory?: boolean): void` - Activate a context
- `hasContext(contextKey: string): boolean` - Check if context exists

### `useMultiRouterContext()`

Composable for use inside a `MultiRouterContext`.

**Returns:**
- `manager: useMultiRouter()` - MultiRouter manager instance
- `contextKey: string` - This context's key
- `isActive: ComputedRef<boolean>` - Whether this context is active
- `isHistoryActive: ComputedRef<boolean>` - Whether this context controls browser URL
- `activeContextKey: ComputedRef<string>` - Currently active context key
- `activeHistoryContextKey: ComputedRef<string>` - Currently active history context key
- `historyEnabled: ComputedRef<boolean>` - Whether history is enabled for this context
- `activate(updateHistory?: boolean): void` - Activate this context
- `setActive(contextKey: string, updateHistory?: boolean): void` - Activate a context
- `hasContext(contextKey: string): boolean` - Check if context exists

## Examples

### Cards with Query Parameters

```vue
<template>
  <div v-for="card in cards" :key="card.id">
    <MultiRouterContext
      type="card"
      :name="`card-${card.id}`"
      initial-location="/card/content"
      :history-enabled="false"
    >
      <CardContent @close="removeCard(card.id)" />
    </MultiRouterContext>
  </div>
</template>
```

### Accessing Route in Context

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Navigate within this context
function goToPage(path) {
  router.push(path)
}

// Access query params
const searchQuery = computed(() => route.query.q)
</script>
```

## Peer Dependencies

- `vue`: ^3.5.0
- `vue-router`: ^4.0.0

## License

MIT

## Development

### Running Playground Locally

```bash
# Development mode (hot reload)
npm run play

# Production preview
npm run build:playground
npm run preview:playground
```

### Building

```bash
# Build library
npm run build

# Build playground for deployment
npm run build:playground
```

### Testing & Quality

```bash
# Run all checks
npm run check

# Type checking
npm run ts:check

# Linting
npm run lint

# Formatting
npm run format
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
