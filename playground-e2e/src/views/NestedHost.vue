<script setup lang="ts">
import { MultiRouterContext, useMultiRouter } from 'vue-multi-router'

const { activeContextKey } = useMultiRouter()
</script>

<template>
  <main>
    <h1>Nested Routes</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>

    <div class="panels">
      <MultiRouterContext type="panel" name="nested-panel" initial-location="/nested/child">
        <section class="panel" data-testid="nested-panel">
          <strong>Nested Panel</strong>
          <RouterView />
        </section>
      </MultiRouterContext>
    </div>
  </main>
</template>
