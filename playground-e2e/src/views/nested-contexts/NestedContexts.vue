<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { MultiRouterContext, useMultiRouter } from 'vue-multi-router'
import { useNestedStack } from './nestedStack'

// Fixture for nested router contexts: a base panel that can stack child panels,
// each its own context. Exercises the library's parent↔child support — close
// falls back to the parent, reload restores the deepest, activeContext follows.
const { manager, activeContextKey, setActive } = useMultiRouter()
const { chain } = useNestedStack()

// Seed the base panel as active only on a fresh entry (like a real app activates
// a drawer on open, not on every mount). On reload with a restored stack the
// library re-activates the deepest level on its own — seeding the base here would
// churn the browser history by activating an ancestor first.
onMounted(async () => {
  await nextTick()
  if (chain.value.length === 0 && manager.has('np')) setActive('np')
})
</script>

<template>
  <main>
    <h1>Nested Contexts</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>

    <div class="panels">
      <MultiRouterContext type="panel" name="np" initial-location="/np/0">
        <RouterView />
      </MultiRouterContext>
    </div>
  </main>
</template>
