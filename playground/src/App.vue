<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import './style.css'
import { MultiRouterContext, MultiRouterContextActivator } from '../../src'
</script>

<template>
  <NConfigProvider>
    <NMessageProvider>
      <MultiRouterContext type="main" name="main" default>
        <MultiRouterContextActivator>
          <RouterView />
        </MultiRouterContextActivator>
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
