<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
import { useMultiRouter } from 'vue-multi-router'

const { activeContextKey, setActive } = useMultiRouter()
</script>

<template>
  <main>
    <h1>Context Switching</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>

    <div class="toolbar">
      <button data-testid="activate-panel-a" @click="setActive('panel-a', false)">
        Activate Panel A
      </button>
      <button data-testid="activate-panel-b" @click="setActive('panel-b', false)">
        Activate Panel B
      </button>
    </div>

    <div class="panels">
      <MultiRouterContext type="panel" name="panel-a" initial-location="/page-a" :activator="false">
        <div class="panel" data-testid="panel-a">
          <strong>Panel A</strong>
          <RouterView />
        </div>
      </MultiRouterContext>

      <MultiRouterContext type="panel" name="panel-b" initial-location="/page-b" :activator="false">
        <div class="panel" data-testid="panel-b">
          <strong>Panel B</strong>
          <RouterView />
        </div>
      </MultiRouterContext>
    </div>
  </main>
</template>
