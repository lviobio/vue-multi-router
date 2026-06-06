<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
</script>

<template>
  <main>
    <h1>Edge Cases</h1>

    <div class="panels">
      <!-- initial-location as a named route object -->
      <MultiRouterContext
        type="panel"
        name="edge-named"
        :initial-location="{ name: 'panel-page-b' }"
        :activator="false"
      >
        <section class="panel" data-testid="edge-named-panel">
          <strong>Named initial location</strong>
          <RouterView />
        </section>
      </MultiRouterContext>

      <!-- Duplicate context name: the second one must warn, skip registration
           and still render its slot without crashing the app -->
      <MultiRouterContext
        type="panel"
        name="edge-dup"
        initial-location="/page-a"
        :activator="false"
      >
        <section class="panel" data-testid="edge-dup-first">
          <strong>Duplicate (first)</strong>
          <RouterView />
        </section>
      </MultiRouterContext>

      <MultiRouterContext
        type="panel"
        name="edge-dup"
        initial-location="/page-b"
        :activator="false"
      >
        <section class="panel" data-testid="edge-dup-second">
          <strong>Duplicate (second)</strong>
          <div data-testid="edge-dup-second-slot">slot rendered</div>
        </section>
      </MultiRouterContext>
    </div>
  </main>
</template>
