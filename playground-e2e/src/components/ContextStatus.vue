<script setup lang="ts">
import { useMultiRouterContext } from 'vue-multi-router'

const { contextKey, isActive, isHistoryActive, historyEnabled } = useMultiRouterContext()
</script>

<template>
  <dl class="context-status">
    <dt>active</dt>
    <dd :data-testid="`${contextKey}-is-active`">{{ isActive }}</dd>
    <dt>history active</dt>
    <dd :data-testid="`${contextKey}-is-history-active`">{{ isHistoryActive }}</dd>
    <dt>history enabled</dt>
    <dd :data-testid="`${contextKey}-history-enabled`">{{ historyEnabled }}</dd>
  </dl>
</template>
