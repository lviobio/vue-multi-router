# createMultiRouter

Creates a multi-router instance that manages multiple independent routing contexts.

## Signature

```typescript
function createMultiRouter(options: MultiRouterOptions): MultiRouter
```

## Parameters

### options

| Property            | Type                  | Required | Description                                            |
|---------------------|-----------------------|----------|--------------------------------------------------------|
| `history`           | `() => RouterHistory` | Yes      | Vue Router history instance                            |
| `routes`            | `RouteRecordRaw[]`    | Yes      | Route definitions                                      |
| `contextSwitchMode` | `'push' \| 'replace'` | No       | How to handle URL on context switch. Default: `'push'` |

## Returns

### MultiRouter

| Property           | Type                           | Description                        |
|--------------------|--------------------------------|------------------------------------|
| `router`           | `Router`                       | The underlying Vue Router instance |
| `setActive`        | `(key: ContextKey) => void`    | Activate a context by key          |
| `hasContext`       | `(key: ContextKey) => boolean` | Check if a context exists          |
| `activeContextKey` | `Ref<ContextKey \| null>`      | Currently active context key       |

## Usage

```typescript
import { createMultiRouter, contextTemplateWindows } from 'vue-multi-router'
import { createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
]

const multiRouter = createMultiRouter({
  history: createWebHistory(),
  routes,
  contextSwitchMode: 'push',
})

// Use the router with Vue
app.use(multiRouter)

// Programmatically activate a context
multiRouter.setActive('my-window')

// Check if a context exists
if (multiRouter.hasContext('my-window')) {
  // ...
}
```

## History Modes

Works with any Vue Router history mode:

```typescript
import { createWebHistory, createWebHashHistory, createMemoryHistory } from 'vue-router'

// Browser history (clean URLs)
createMultiRouter({
  history: createWebHistory(),
  // ...
})

// Hash history (for static hosting)
createMultiRouter({
  history: createWebHashHistory(),
  // ...
})

// Memory history (for SSR or testing)
createMultiRouter({
  history: createMemoryHistory(),
  // ...
})
```
