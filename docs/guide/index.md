# What is vue-multi-router?

**vue-multi-router** is a Vue 3 library that enables multiple independent routers running simultaneously in a single application.

## Why Multiple Routers?

Traditional Vue Router provides a single routing context for your entire application. While this works well for most cases, some applications need multiple independent navigation areas:

- **Dashboard applications** with multiple navigation panels
- **Desktop-like UIs** with floating windows, each with its own navigation
- **Tabbed interfaces** where each tab maintains independent routing state
- **Multi-panel layouts** where different sections navigate independently

## How It Works

vue-multi-router wraps Vue Router and adds a context management layer. Each `MultiRouterContext` component creates an independent routing context that:

- Has its own navigation history
- Can be activated/deactivated independently
- Optionally persists its state to SessionStorage
- Shares the same route definitions with other contexts

```vue
<template>
  <div class="panels">
    <!-- Each panel has independent routing -->
    <MultiRouterContext type="window" name="panel-1">
      <RouterView />
    </MultiRouterContext>

    <MultiRouterContext type="window" name="panel-2">
      <RouterView />
    </MultiRouterContext>
  </div>
</template>
```

## Key Features

### History Management

Each context maintains its own navigation stack with optional SessionStorage persistence, allowing users to navigate back/forward within each context independently.

### Seamless Integration

Built on Vue Router 4, vue-multi-router uses the same route definitions and navigation APIs you're already familiar with.
