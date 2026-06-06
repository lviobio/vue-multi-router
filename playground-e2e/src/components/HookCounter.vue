<script setup lang="ts">
import { ref } from 'vue'
import { onMultiRouterContextActivate, useMultiRouterContext } from 'vue-multi-router'

const { contextKey } = useMultiRouterContext()

const count = ref(0)

onMultiRouterContextActivate(() => {
  count.value++
})
</script>

<template>
  <span>
    activations:
    <span :data-testid="`${contextKey}-activate-count`">{{ count }}</span>
  </span>
</template>
