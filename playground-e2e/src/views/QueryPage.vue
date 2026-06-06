<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMultiRouterContext } from 'vue-multi-router'

const route = useRoute()
const router = useRouter()

const { contextKey } = useMultiRouterContext()

const value = ref('')

watch(value, (v) => {
  const next = v ? v : undefined
  // Skip redundant pushes: when the value was just synced FROM the query, a
  // same-location push would cancel other in-flight navigations (e.g. the
  // PanelRouteGuard redirect on boot)
  if ((route.query.value ?? undefined) === next) return

  router.push({
    ...route,
    query: { ...route.query, value: next },
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
