<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMultiRouterContext } from 'vue-multi-router'

const route = useRoute()
const router = useRouter()

const { contextKey } = useMultiRouterContext()

const value = ref('')

watch(value, (v) => {
  router.push({
    ...route,
    query: { ...route.query, value: v ? v : undefined },
  })
})

watch(
  () => route.query.value,
  (v) => {
    value.value = typeof v === 'string' ? v : ''
  },
  { immediate: true },
)
</script>

<template>
  <div class="query-page">
    <input v-model="value" :data-testid="`${contextKey}-input`" placeholder="Type something..." />
    <code :data-testid="`${contextKey}-fullpath`">{{ route.fullPath }}</code>
    <nav class="page-links">
      <RouterLink :data-testid="`${contextKey}-go-page-b`" to="/page-b">Page B</RouterLink>
    </nav>
  </div>
</template>
