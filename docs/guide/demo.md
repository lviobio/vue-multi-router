# Interactive Demo

Try the multi-router in action. Each "card" below is an independent routing context, and the browser frame is another context.

<script setup>
import { ref } from 'vue'
</script>

<ClientOnly>
  <CardsDemo />
</ClientOnly>

## What's Happening

1. **Independent URL per context** — Each browser window shows its own URL in the address bar
2. **Navigation buttons** — Use ← → to navigate back/forward within each context
3. **Separate state** — Click different pages and type in the search box — each window maintains its own route
4. **Active indicator** — The highlighted border shows which context is currently active

## How It Works

Each browser window is wrapped in `MultiRouterContext`:

```vue
<template>
  <MultiRouterContext
    v-for="window in windows"
    :key="window.id"
    type="window"
    :name="`window-${window.id}`"
    initial-location="/"
    :history-enabled="true"
  >
    <BrowserContent />
  </MultiRouterContext>
</template>
```

Inside each window, components use `useMultiRouterContext()` to access their own router:

```vue
<script setup>
import { useMultiRouterContext } from 'vue-multi-router'

const { router, route, isActive } = useMultiRouterContext()

// Navigation within this context only
function goToSettings() {
  router.push('/settings')
}

// Access current route
console.log(route.fullPath) // e.g., "/settings?search=hello"
</script>
```

## Try It

1. **Add multiple card** using the "+ Add Card" button
2. **Click on a card** to activate it (notice the border highlight)
3. **Navigate** using the page buttons (Home, Dashboard, Settings, Profile)
4. **Type in the search box** to see query params update in the URL
5. **Use back/forward buttons** to navigate through each window's history
6. **Close card** using the red button

Each card maintains completely independent routing state!
