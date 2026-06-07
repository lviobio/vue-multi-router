<script setup lang="ts">
import { NLayout, NLayoutContent } from 'naive-ui'
import AppHeader from './AppHeader.vue'
</script>

<template>
  <NLayout>
    <AppHeader />
    <NLayoutContent content-style="padding: 24px;" content-class="h-screen!">
      <RouterView />
    </NLayoutContent>
  </NLayout>
</template>
