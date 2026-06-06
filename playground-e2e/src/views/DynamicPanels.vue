<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { MultiRouterContext, useMultiRouter } from 'vue-multi-router'
import ContextStatus from '../components/ContextStatus.vue'

const { activeContextKey, setActive, hasContext } = useMultiRouter()

const STORAGE_KEY = 'e2e-dynamic-panels'

function load(): number[] {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : [1]
}

const panels = ref<number[]>(load())

watch(
  panels,
  (value) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

const counter = computed(() => (panels.value.length > 0 ? Math.max(...panels.value) : 0))

async function addPanel() {
  const position = counter.value + 1
  const contextName = `panel-${position}`
  panels.value.push(position)
  // Wait for the component to mount and register the context
  await nextTick()
  if (hasContext(contextName)) {
    setActive(contextName)
  }
}

function removePanel(position: number) {
  const index = panels.value.indexOf(position)
  if (index > -1) {
    panels.value.splice(index, 1)
  }
}
</script>

<template>
  <main>
    <h1>Dynamic Panels</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>

    <div class="toolbar">
      <button data-testid="add-panel" @click="addPanel">Add panel</button>
    </div>

    <div class="panels">
      <MultiRouterContext
        v-for="position in panels"
        :key="position"
        type="panel"
        :name="`panel-${position}`"
        initial-location="/query-page"
        prevent-class="panel-remove"
      >
        <section class="panel" :data-testid="`panel-${position}`">
          <header class="panel-header">
            <strong>Panel {{ position }}</strong>
            <button
              class="panel-remove"
              :data-testid="`remove-panel-${position}`"
              @click="removePanel(position)"
            >
              ×
            </button>
          </header>
          <ContextStatus />
          <RouterView />
        </section>
      </MultiRouterContext>
    </div>
  </main>
</template>
