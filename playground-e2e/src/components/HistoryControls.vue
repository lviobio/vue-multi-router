<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMultiRouterContext } from 'vue-multi-router'

const router = useRouter()
const { contextKey } = useMultiRouterContext()
</script>

<template>
  <div class="page-links">
    <button :data-testid="`${contextKey}-back`" @click="router.back()">Back</button>
    <button :data-testid="`${contextKey}-forward`" @click="router.forward()">Forward</button>
  </div>
</template>
