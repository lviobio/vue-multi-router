<script setup lang="ts">
import { useMultiRouterContext } from '../../../src'

const { activeContextKey, activeHistoryContextKey } = useMultiRouterContext()
</script>

<template>
  <div class="flex gap-2 items-center">
    <NText depth="2">Context Status</NText>
    <div
      class="flex border rounded-xs border-gray-200 transition-colors transition-duration-500"
      :class="{ 'border-green-600': activeContextKey === 'main' }"
    >
      <span class="px-1 py-0.5">Active</span>
      <span class="bg-gray-200 px-1 py-0.5 min-w-16 text-center">{{ activeContextKey }}</span>
    </div>
    <div
      class="flex border rounded-xs border-gray-200 transition-colors transition-duration-500"
      :class="{ 'border-green-600': activeHistoryContextKey === 'main' }"
    >
      <span class="px-1 py-0.5">History</span>
      <span class="bg-gray-200 px-1 py-0.5 min-w-16 text-center">{{
        activeHistoryContextKey
      }}</span>
    </div>
  </div>
</template>
