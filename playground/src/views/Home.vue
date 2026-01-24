<script setup lang="ts">
import { NCard, NButton, NSpace, NAlert } from 'naive-ui'
</script>

<template>
  <NSpace vertical>
    <NAlert title="Welcome" type="info">
      This is a demo playground for Vue Multi Router with Naive UI.
    </NAlert>

    <NCard title="Getting Started">
      <NSpace>
        <NButton type="primary">Primary</NButton>
        <NButton>Default</NButton>
        <NButton type="tertiary">Tertiary</NButton>
      </NSpace>
    </NCard>
  </NSpace>
</template>
