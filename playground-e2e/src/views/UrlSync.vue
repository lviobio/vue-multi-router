<script setup lang="ts">
import { MultiRouterContext, useMultiRouter } from 'vue-multi-router'
import ContextStatus from '../components/ContextStatus.vue'
import HistoryControls from '../components/HistoryControls.vue'

const { activeContextKey, activeHistoryContextKey } = useMultiRouter()
</script>

<template>
  <main>
    <h1>URL Sync</h1>

    <p>
      Active context:
      <span data-testid="active-context">{{ activeContextKey ?? 'none' }}</span>
    </p>
    <p>
      Active history context:
      <span data-testid="active-history-context">{{ activeHistoryContextKey ?? 'none' }}</span>
    </p>

    <div class="panels">
      <MultiRouterContext type="panel" name="sync-a" initial-location="/query-page?id=a">
        <section class="panel" data-testid="sync-a-panel">
          <strong>Sync A</strong>
          <ContextStatus />
          <RouterView />
        </section>
      </MultiRouterContext>

      <MultiRouterContext type="panel" name="sync-b" initial-location="/query-page?id=b">
        <section class="panel" data-testid="sync-b-panel">
          <strong>Sync B</strong>
          <ContextStatus />
          <RouterView />
        </section>
      </MultiRouterContext>

      <MultiRouterContext
        type="panel"
        name="no-history"
        initial-location="/query-page?id=no-history"
        :history-enabled="false"
      >
        <section class="panel" data-testid="no-history-panel">
          <strong>No History</strong>
          <ContextStatus />
          <HistoryControls />
          <RouterView />
        </section>
      </MultiRouterContext>
    </div>
  </main>
</template>
