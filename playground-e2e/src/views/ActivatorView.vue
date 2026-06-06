<script setup lang="ts">
import { MultiRouterContext, MultiRouterContextActivator, useMultiRouter } from 'vue-multi-router'
import ContextStatus from '../components/ContextStatus.vue'

const { activeContextKey } = useMultiRouter()
</script>

<template>
  <main>
    <h1>Activator</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>

    <div class="panels">
      <MultiRouterContext
        type="panel"
        name="act-one"
        initial-location="/page-a"
        prevent-class="no-activate"
      >
        <section class="panel" data-testid="act-one-panel">
          <strong>Panel One (built-in activator)</strong>
          <ContextStatus />
          <button class="no-activate" data-testid="act-one-prevent">Prevented button</button>
          <RouterView />
        </section>
      </MultiRouterContext>

      <MultiRouterContext type="panel" name="act-two" initial-location="/page-b" :activator="false">
        <section class="panel" data-testid="act-two-panel">
          <strong>Panel Two (explicit activator)</strong>
          <ContextStatus />
          <div data-testid="act-two-outside">Outside the activator</div>
          <MultiRouterContextActivator as="button" data-testid="act-two-activator">
            Activate Panel Two
          </MultiRouterContextActivator>
          <RouterView />
        </section>
      </MultiRouterContext>
    </div>
  </main>
</template>
