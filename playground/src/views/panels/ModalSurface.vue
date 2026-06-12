<script setup lang="ts">
import { computed } from 'vue'
import { usePanels } from '../../composables/usePanels'
import FloatingWindow from './FloatingWindow.vue'

// Modal host: a full-screen, click-through layer holding one free-floating,
// draggable window per panel. Windows are modeless (no mask), so any number can
// be open and interacted with at once; each is its own router context.
const { panels } = usePanels()

const items = computed(() => panels.value.filter((p) => p.surface === 'modal'))
</script>

<template>
  <div class="modal-layer">
    <FloatingWindow v-for="panel in items" :key="panel.id" :panel="panel" />
  </div>
</template>

<style scoped>
.modal-layer {
  position: fixed;
  inset: 0;
  z-index: 3000;
  /* The layer itself must not block the page; each window re-enables events. */
  pointer-events: none;
}
</style>
