<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import { MultiRouterContext } from '../../src'
import PanelSurfaces from './views/panels/PanelSurfaces.vue'
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

      <!-- Window manager: sibling surfaces (drawer, modal, …) that host panels,
           each panel its own router context. Open one with a `panel` navigation. -->
      <PanelSurfaces />
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
