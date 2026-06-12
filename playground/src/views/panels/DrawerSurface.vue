<script setup lang="ts">
import { computed } from 'vue'
import { usePanels } from '../../composables/usePanels'
import DrawerPanel from './DrawerPanel.vue'

// Drawer host: renders its panels as a left-edge cascade — each deeper one a
// little narrower and in front, the familiar stacked-drawer look, but the panels
// are flat and independent (no nested contexts). Each DrawerPanel owns its own
// open/close animation; close/move/expand happen via the shared header.
const { panels } = usePanels()

const items = computed(() =>
  panels.value.filter((p) => p.surface === 'drawer').sort((a, b) => a.z - b.z),
)

const widthOf = (index: number) => Math.max(502 - index * 40, 320)
</script>

<template>
  <DrawerPanel
    v-for="(panel, i) in items"
    :key="panel.id"
    :panel="panel"
    :width="widthOf(i)"
    :z-index="2000 + i"
  />
</template>
