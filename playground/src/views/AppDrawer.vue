<script setup lang="ts">
import { MultiRouterContext } from '../../../src'
import { DRAWER_CONTEXT } from '../composables/useDrawerStack'
import AppDrawerContent from './AppDrawerContent.vue'
</script>

<template>
  <!-- App-level drawer: its own router context, so any route can render inside
       it and its state survives reloads. activator=false — visibility is driven
       by whether this context owns the browser history (see AppDrawerContent).
       Lives as a sibling of the "main" context so both register before startup
       activation runs, letting a restored-open drawer reclaim activation. -->
  <MultiRouterContext
    type="drawer"
    :name="DRAWER_CONTEXT"
    initial-location="/"
    keep-history
    :activator="false"
  >
    <AppDrawerContent />
  </MultiRouterContext>
</template>
