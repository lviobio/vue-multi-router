# MultiRouterContext

A wrapper component that creates an independent routing context.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | — | Context type |
| `name` | `string` | — | Unique identifier for this context |
| `initialLocation` | `string` | `'/'` | Starting route for this context |
| `historyEnabled` | `boolean` | `false` | Enable history persistence |
| `preventClass` | `string` | — | CSS class to prevent context activation |

## Slots

### default

The default slot receives the context's router view.

```vue
<MultiRouterContext type="window" name="my-window">
  <RouterView />
</MultiRouterContext>
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `activate` | — | Emitted when context becomes active |
| `deactivate` | — | Emitted when context becomes inactive |

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
</script>

<template>
  <MultiRouterContext type="window" name="panel-1">
    <RouterView />
  </MultiRouterContext>
</template>
```

### With History

```vue
<MultiRouterContext
  type="tab"
  name="editor-tab"
  initial-location="/editor"
  :history-enabled="true"
>
  <RouterView />
</MultiRouterContext>
```

### Multiple Contexts

```vue
<template>
  <div class="layout">
    <aside>
      <MultiRouterContext type="window" name="sidebar" initial-location="/menu">
        <RouterView />
      </MultiRouterContext>
    </aside>

    <main>
      <MultiRouterContext type="window" name="main" initial-location="/dashboard">
        <RouterView />
      </MultiRouterContext>
    </main>

    <aside>
      <MultiRouterContext type="window" name="inspector" initial-location="/details">
        <RouterView />
      </MultiRouterContext>
    </aside>
  </div>
</template>
```

### Handling Events

```vue
<script setup lang="ts">
function onActivate() {
  console.log('Context activated')
}

function onDeactivate() {
  console.log('Context deactivated')
}
</script>

<template>
  <MultiRouterContext
    type="window"
    name="my-window"
    @activate="onActivate"
    @deactivate="onDeactivate"
  >
    <RouterView />
  </MultiRouterContext>
</template>
```

### Prevent Class

Use `preventClass` to prevent automatic context activation when clicking on certain elements:

```vue
<MultiRouterContext
  type="window"
  name="my-window"
  prevent-class="no-activate"
>
  <div>
    <button>Click activates context</button>
    <button class="no-activate">Click does NOT activate context</button>
  </div>
</MultiRouterContext>
```
