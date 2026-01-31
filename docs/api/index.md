# API Reference

This section documents the public API of vue-multi-router.

## Factory Functions

| Function | Description |
|----------|-------------|
| [createMultiRouter](/api/create-multi-router) | Creates a multi-router instance with context management |

## Components

| Component | Description |
|-----------|-------------|
| [MultiRouterContext](/api/multi-router-context) | Wrapper component that defines a routing context |

## Composables

| Composable | Description |
|------------|-------------|
| [useMultiRouterContext](/api/use-multi-router-context) | Access current context's router, route, and state |
| [useMultiRouter](/api/use-multi-router) | Access the multi-router instance for global operations |

## Context Templates

| Template | Description |
|----------|-------------|
| `contextTemplateWindows` | Multiple independent windows |
| `contextTemplateTabs` | Multiple independent tabs |
| `contextTemplateMainWithWindows` | Main context + windows |
| `contextTemplateDesktopWithWindows` | Desktop container + windows |
| `contextTemplateTabsWithWindows` | Tabs + windows combination |

## Types

```typescript
import type {
  MultiRouterOptions,
  MultiRouter,
  ContextKey,
} from 'vue-multi-router'
```
