# useMultiRouter

A composable that provides access to the multi-router instance for global operations.

## Signature

```typescript
function useMultiRouter(): UseMultiRouterReturn
```

## Returns

| Property | Type | Description |
|----------|------|-------------|
| `setActive` | `(key: ContextKey) => void` | Activate a context by its key |
| `hasContext` | `(key: ContextKey) => boolean` | Check if a context exists |
| `activeContextKey` | `ComputedRef<ContextKey \| null>` | Currently active context key |

## Usage

### Activate a Specific Context

```vue
<script setup lang="ts">
import { useMultiRouter } from 'vue-multi-router'

const { setActive } = useMultiRouter()

function activateSettingsPanel() {
  setActive('settings')
}
</script>

<template>
  <button @click="activateSettingsPanel">
    Open Settings Panel
  </button>
</template>
```

### Check if Context Exists

```vue
<script setup lang="ts">
import { useMultiRouter } from 'vue-multi-router'
import { computed } from 'vue'

const { hasContext } = useMultiRouter()

const settingsExists = computed(() =>
  hasContext('settings')
)
</script>

<template>
  <button v-if="settingsExists" @click="activateSettings">
    Activate Settings
  </button>
  <span v-else>Settings panel not mounted</span>
</template>
```

### Track Active Context

```vue
<script setup lang="ts">
import { useMultiRouter } from 'vue-multi-router'

const { activeContextKey } = useMultiRouter()
</script>

<template>
  <div class="status-bar">
    <span v-if="activeContextKey">
      Active: {{ activeContextKey.type }} / {{ activeContextKey.name }}
    </span>
    <span v-else>No active context</span>
  </div>
</template>
```

### Switching Between Contexts

```vue
<script setup lang="ts">
import { useMultiRouter } from 'vue-multi-router'

const { setActive, activeContextKey } = useMultiRouter()

const tabs = [
  { type: 'tab', name: 'tab-1', label: 'Home' },
  { type: 'tab', name: 'tab-2', label: 'Profile' },
  { type: 'tab', name: 'tab-3', label: 'Settings' },
]

function isTabActive(tab: { type: string; name: string }) {
  return (
    activeContextKey.value?.type === tab.type &&
    activeContextKey.value?.name === tab.name
  )
}
</script>

<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      :class="{ active: isTabActive(tab) }"
      @click="setActive(tab.name)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
```

## Difference from useMultiRouterContext

| Feature | useMultiRouter | useMultiRouterContext |
|---------|----------------|----------------------|
| Scope | Global | Current context only |
| Router access | No | Yes |
| Route access | No | Yes |
| Activate any context | Yes | Current context only |
| Check any context | Yes | No |

Use `useMultiRouter` when you need to:
- Control contexts from outside (e.g., tab bar, window manager)
- Check if specific contexts exist
- Build custom context management UI

Use `useMultiRouterContext` when you need to:
- Navigate within the current context
- Access the current route
- Check if current context is active
