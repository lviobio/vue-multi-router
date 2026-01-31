# History Management

vue-multi-router provides independent history management for each routing context, allowing users to navigate back/forward within each context independently.

## How It Works

Each `MultiRouterContext` with history enabled maintains its own virtual navigation stack. This stack tracks navigation actions within that context and allows:

- Independent back/forward navigation per context
- State persistence across page reloads (via SessionStorage)
- Browser history integration for the active context

## Enabling History

Enable history persistence for a context:

```vue
<MultiRouterContext
  type="window"
  name="my-window"
  :history-enabled="true"
>
  <RouterView />
</MultiRouterContext>
```

## Initial Location

Set the starting route for a context:

```vue
<MultiRouterContext
  type="window"
  name="settings-panel"
  initial-location="/settings"
  :history-enabled="true"
>
  <RouterView />
</MultiRouterContext>
```

## Programmatic Navigation

Navigate within the current context using the context's router:

```vue
<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { router } = useMultiRouterContext()

function navigate() {
  // Navigation happens within this context only
  router.push('/new-route')
}

function goBack() {
  router.back()
}

function goForward() {
  router.forward()
}
</script>
```

## Storage Adapters

By default, vue-multi-router uses SessionStorage for history persistence. The history state is automatically saved and restored across page reloads.

### Storage Keys

Each context's history is stored under a unique key based on the context name:

```
vue-multi-router:history:{context-name}
```

## Context Activation

When a context becomes active, its history state syncs with the browser's history. The active context receives browser back/forward button events.

```vue
<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { isActive, activate } = useMultiRouterContext()
</script>

<template>
  <div @click="activate" :class="{ active: isActive }">
    <!-- This context's history becomes active on click -->
  </div>
</template>
```

## Best Practices

1. **Unique Names**: Always use unique names for contexts to avoid storage conflicts

2. **Initial Location**: Provide `initial-location` for contexts that should start on a specific route

3. **History Toggle**: Consider allowing users to enable/disable history per context for flexibility

```vue
<script setup lang="ts">
import { ref } from 'vue'

const historyEnabled = ref(true)
</script>

<template>
  <label>
    <input type="checkbox" v-model="historyEnabled" />
    Enable history
  </label>

  <MultiRouterContext
    type="window"
    name="my-window"
    :history-enabled="historyEnabled"
  >
    <RouterView />
  </MultiRouterContext>
</template>
```
