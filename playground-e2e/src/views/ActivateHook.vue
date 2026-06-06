<script setup lang="ts">
import { ref } from 'vue'
import { MultiRouterContext, useMultiRouter } from 'vue-multi-router'
import HookCounter from '../components/HookCounter.vue'

const { activeContextKey } = useMultiRouter()

const showCounterOne = ref(true)
const showCounterTwo = ref(true)
</script>

<template>
  <main>
    <h1>Activate Hook</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>

    <!-- mousedown.stop: these controls must not switch activation to main,
         the remount tests rely on the panel staying active -->
    <div class="toolbar">
      <button
        data-testid="toggle-counter-one"
        @mousedown.stop
        @click="showCounterOne = !showCounterOne"
      >
        Toggle counter one
      </button>
      <button
        data-testid="toggle-counter-two"
        @mousedown.stop
        @click="showCounterTwo = !showCounterTwo"
      >
        Toggle counter two
      </button>
    </div>

    <div class="panels">
      <MultiRouterContext type="panel" name="hook-one" initial-location="/page-a">
        <section class="panel" data-testid="hook-one-panel">
          <strong>Hook One</strong>
          <HookCounter v-if="showCounterOne" />
          <RouterView />
        </section>
      </MultiRouterContext>

      <MultiRouterContext type="panel" name="hook-two" initial-location="/page-b">
        <section class="panel" data-testid="hook-two-panel">
          <strong>Hook Two</strong>
          <HookCounter v-if="showCounterTwo" />
          <RouterView />
        </section>
      </MultiRouterContext>
    </div>
  </main>
</template>
