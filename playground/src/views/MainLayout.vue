<script setup lang="ts">
import { NLayout, NLayoutHeader, NLayoutContent } from 'naive-ui'
</script>

<template>
  <NLayout>
    <NLayoutHeader bordered style="height: 64px; padding: 16px 24px">
      <h2 style="margin: 0">Vue Multi Router Demo</h2>
    </NLayoutHeader>
    <NLayoutContent content-style="padding: 24px;">
      <RouterView />
    </NLayoutContent>
  </NLayout>
</template>
