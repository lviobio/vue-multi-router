<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Panel-content routes (meta.multiRouterRoot) are not valid top-level entries
// for the main context — e.g. a stale URL left in the address bar after
// sessionStorage was cleared while a panel owned the browser URL. Without
// storage the library cannot tell such a URL from a legitimate deep link,
// so the app decides: send main back home instead of rendering panel
// content fullscreen.
watch(
  () => route.matched.some((record) => record.meta.multiRouterRoot),
  (onPanelRoute) => {
    if (onPanelRoute) {
      router.replace('/')
    }
  },
  { immediate: true },
)
</script>

<template>
  <!-- renderless -->
  <span v-if="false" />
</template>
