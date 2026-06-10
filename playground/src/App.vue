<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import { MultiRouterContext } from '../../src'
import AppDrawer from './views/AppDrawer.vue'
</script>

<template>
  <NConfigProvider
    :theme-overrides="{
      Form: {
        labelTextColor: 'var(--color-gray-500)',
        labelPaddingVertical: '0 0 0 2px',
      },
    }"
  >
    <NMessageProvider>
      <MultiRouterContext
        type="main"
        name="main"
        default
        as-root
        prevent-class="prevent-context-activation n-tabs-tab--addable"
      >
        <RouterView />
      </MultiRouterContext>

      <!-- App-level drawer: a sibling context, so it can render any route on top
           of whatever "main" is showing. Open it with a `drawer: true` navigation. -->
      <AppDrawer />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    v-sans,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}
</style>
