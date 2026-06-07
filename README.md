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

- ✅ **Multiple Independent Routers** - Run multiple Vue Router instances simultaneously in a single app
- ✅ **Context-Based Navigation** - Each routing context maintains its own navigation history
- ✅ **Browser History Integration** - Back/forward buttons work across contexts with proper URL updates
- ✅ **Session Persistence** - Context states persist across page reloads via SessionStorage or other implementations
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **Composable API** - Easy-to-use composables for accessing router state

## Motivation

Vue Router is designed around a single-router-per-app model. That works well for most applications, but falls short when your UI needs **multiple independent navigation areas** — each with its own route, history stack, and back/forward behavior.

Think of:

- **Dashboard applications** with several panels, each displaying a different page
- **Desktop-like UIs** with floating or tiled windows that navigate independently
- **Tabbed interfaces** where each tab has its own browsing history
- **Multi-pane editors** (email clients, admin tools) with a sidebar, list, and detail view that all route separately

Without vue-multi-router you'd have to juggle manual `<component :is>` switching, duplicate router instances with conflicting URL ownership, or complex query-parameter schemes — all of which break browser history and become hard to maintain.

vue-multi-router solves this by letting you wrap any part of your template in a `<MultiRouterContext>`. Each context gets its own virtual navigation stack while sharing a single set of route definitions and a single browser URL. The library manages history entries so that the browser back/forward buttons work correctly across every context, and state is persisted through page reloads via SessionStorage.

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
    <MultiRouterContext type="panel" :name="`panel-${panel.id}`" initial-location="/home">
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
- `historyOptions?: MultiRouterHistoryManagerOptions` - History management options (see below)

### Browser History & Back/Forward

All contexts share the single browser history timeline, while each context also keeps its own
virtual navigation stack. Two mechanisms control how they interact:

**`historyOptions.contextSwitchMode: 'none' | 'replace' | 'push'`** (default: `'replace'`) —
how the browser URL is updated when the active context changes:

- `'replace'` - The URL switches to the new context's location by replacing the current history
  entry. Context switches never add back/forward steps: the timeline contains only real
  navigations (pushes).
- `'push'` - Switching to a context whose URL differs from the current one pushes a new history
  entry. Every switch becomes its own back/forward step, giving the most granular replay at the
  cost of a longer history.
- `'none'` - Context switches never touch the URL. It changes only when the active context
  itself navigates.

**Position snapshots.** Every browser history entry records the virtual-stack positions of _all_
history-enabled contexts at the moment it was created (in `history.state`). On back/forward the
whole snapshot is applied, so the entire app — every panel, not just the context that owns the
entry — returns to the exact state it had at that point in the timeline.

Activation on back/forward also follows the recorded history: each entry is owned by the context
that was active when the entry was created, and traversing onto an entry re-activates its owner.

**Replay granularity in `'replace'` mode.** Because context switches replace the current entry,
the previous context's latest entry can be evicted from the shared timeline. Its state is not
lost — the following entries' snapshots still reference it — but the evicted moment is no longer
a separate back/forward stop. Example with two panels:

1. Click into panel-1, type `q` (pushes `?value=q`)
2. Click into panel-2 (replaces that entry), type `a` (pushes `?value=a`)

Going back twice undoes both inputs; going forward twice restores both (`q` and `a`). But steps
1 and 2 share one history transition: forward restores panel-1's `q` and activates panel-2 in
the same step — exactly the combined historical state, since "panel-1 active with `q`" was
evicted as a standalone stop. If every action must be replayable as its own step, use
`contextSwitchMode: 'push'`.

Note that pushes from an _inactive_ context only update its virtual stack — they never create
browser history entries. Later snapshots still capture the new position, so the state is
restored on replay, but there is no dedicated back/forward step for it.

### Storage Adapters

Each context's virtual stack (and the active-context bookkeeping) is persisted through a
storage adapter, passed via `historyOptions.storageAdapter`:

```typescript
import { createMultiRouter, IndexedDBStorageAdapter } from 'vue-multi-router'

const multiRouter = createMultiRouter({
  history: createWebHistory(),
  historyOptions: { storageAdapter: new IndexedDBStorageAdapter() },
  routes,
})
```

Built-in adapters:

- `SessionStorageAdapter` (default) - per-tab persistence, survives reloads
- `IndexedDBStorageAdapter` - survives the tab being closed, shared between same-origin tabs

**Custom backends.** Extend `KeyValueStorageAdapter` and implement three methods — each may
return a value synchronously or a `Promise`. Serialization, storage keys and error handling
(a failing backend logs a warning instead of breaking navigation) are inherited:

```typescript
import { KeyValueStorageAdapter } from 'vue-multi-router'

class ServerStorageAdapter extends KeyValueStorageAdapter {
  protected async getItem(key: string): Promise<string | null> {
    const res = await fetch(`/api/router-state/${encodeURIComponent(key)}`)
    return res.ok ? res.text() : null
  }
  protected async setItem(key: string, value: string): Promise<void> {
    await fetch(`/api/router-state/${encodeURIComponent(key)}`, { method: 'PUT', body: value })
  }
  protected async removeItem(key: string): Promise<void> {
    await fetch(`/api/router-state/${encodeURIComponent(key)}`, { method: 'DELETE' })
  }
}
```

A server-backed adapter makes the navigation state shareable across devices. For full control
(batching several keys into one request, custom wire format) implement the lower-level
`ContextStorageAdapter` interface directly instead.

**Asynchronous adapters are first-class.** When an adapter returns promises:

- a `<MultiRouterContext>` renders its children only after its state has been restored
  (synchronous adapters resolve immediately — nothing changes for them);
- activation decisions on startup wait for all in-flight registrations, so a `default` context
  cannot steal the activation (or the browser URL) from the saved one while it is still loading;
- `setActive(key)` called while the context is still registering is deferred until registration
  completes, and dropped if another activation happens in the meantime.

**Write behavior.** The library optimizes adapter traffic, which matters for remote backends:
mutations of the same stack within one task are coalesced into a single write, writing a value
identical to the last written one is skipped, and writes are chained FIFO so out-of-order
responses can never clobber newer state with older data.

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

- `vue`: ^3.0.0
- `vue-router`: ^4.0.0 || ^5.0.0

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
