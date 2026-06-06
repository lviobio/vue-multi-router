<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MultiRouterContext, useMultiRouter } from 'vue-multi-router'
import ContextStatus from '../components/ContextStatus.vue'

const { activeContextKey } = useMultiRouter()

// Panels mount late to simulate async boundaries (e.g. <Suspense>):
// with the default immediate strategy the saved context registers too late
// to be restored, while the stabilization strategy waits for it.
const ready = ref(false)
onMounted(() => {
  setTimeout(() => {
    ready.value = true
  }, 100)
})
</script>

<template>
  <main>
    <h1>Stabilization</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>

    <div v-if="ready" class="panels">
      <MultiRouterContext type="panel" name="stab-a" initial-location="/page-a">
        <section class="panel" data-testid="stab-a-panel">
          <strong>Stab A</strong>
          <ContextStatus />
          <RouterView />
        </section>
      </MultiRouterContext>

      <MultiRouterContext type="panel" name="stab-b" initial-location="/page-b">
        <section class="panel" data-testid="stab-b-panel">
          <strong>Stab B</strong>
          <ContextStatus />
          <RouterView />
        </section>
      </MultiRouterContext>
    </div>
    <p v-else data-testid="stab-loading">Loading panels…</p>
  </main>
</template>
