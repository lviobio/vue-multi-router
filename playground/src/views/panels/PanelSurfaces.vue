<script setup lang="ts">
import { onMounted } from 'vue'
import { surfaces } from '../../composables/surfaces'
import { usePanels } from '../../composables/usePanels'

// Mounted once in App.vue. Renders every registered surface; each surface draws
// the panels assigned to it. Adding a surface to the registry is all it takes to
// light up a new host here.

// Children mount before this hook, so by now every restored panel has read its
// "restored" flag (to skip the open animation) — clear it so later opens animate.
const { clearRestored } = usePanels()
onMounted(clearRestored)
</script>

<template>
  <component :is="s.component" v-for="s in surfaces" :key="s.id" />
</template>
