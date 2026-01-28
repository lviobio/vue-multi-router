<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import { MultiRouterContext } from '../../src'
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
      <MultiRouterContext type="main" name="main" default>
        <RouterView />
      </MultiRouterContext>
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
