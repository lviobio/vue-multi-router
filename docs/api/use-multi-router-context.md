# useMultiRouterContext

A composable that provides access to the current routing context.

## Signature

```typescript
function useMultiRouterContext(): MultiRouterContextReturn
```

## Returns

| Property | Type | Description |
|----------|------|-------------|
| `router` | `Router` | Vue Router instance for this context |
| `route` | `RouteLocationNormalizedLoaded` | Current route in this context |
| `isActive` | `ComputedRef<boolean>` | Whether this context is currently active |
| `activate` | `() => void` | Activate this context |
| `historyEnabled` | `ComputedRef<boolean>` | Whether history is enabled for this context |
| `activeContextKey` | `ComputedRef<ContextKey \| null>` | Currently active context key |
| `activeHistoryContextKey` | `ComputedRef<ContextKey \| null>` | Active context with history enabled |

## Usage

### Basic Navigation

```vue
<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { router, route } = useMultiRouterContext()

function goToSettings() {
  router.push('/settings')
}
</script>

<template>
  <div>
    <p>Current path: {{ route.path }}</p>
    <button @click="goToSettings">Settings</button>
  </div>
</template>
```

### Active State

```vue
<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { isActive, activate } = useMultiRouterContext()
</script>

<template>
  <div
    :class="{ 'border-blue-500': isActive, 'border-gray-300': !isActive }"
    @click="activate"
  >
    <p>Click to activate this panel</p>
  </div>
</template>
```

### Conditional Rendering Based on Active State

```vue
<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { isActive } = useMultiRouterContext()
</script>

<template>
  <div>
    <div v-if="isActive" class="active-indicator">
      Active
    </div>
    <RouterView />
  </div>
</template>
```

### Using History State

```vue
<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { historyEnabled, router } = useMultiRouterContext()

function goBack() {
  if (historyEnabled.value) {
    router.back()
  }
}
</script>

<template>
  <button @click="goBack" :disabled="!historyEnabled">
    Back
  </button>
</template>
```

### Context Activation Hook

```vue
<script setup lang="ts">
import { useMultiRouterContext, onMultiRouterContextActivate } from 'vue-multi-router'
import { ref } from 'vue'

const inputRef = ref<HTMLInputElement>()

// Called when this context becomes active
onMultiRouterContextActivate(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="inputRef" placeholder="Auto-focuses when context activates" />
</template>
```

## Notes

- Must be called within a `MultiRouterContext` component
- The `router` and `route` are scoped to the current context
- `activate()` is automatically called on click within the context (unless prevented)
