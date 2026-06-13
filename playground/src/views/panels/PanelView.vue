<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MultiRouterContext } from '../../../../src'
import { usePanels, type Panel } from '../../composables/usePanels'

// Host-agnostic body of a panel: its own router context (forced to the panel's
// location, keep-history off — usePanels owns persistence) rendering the routed
// page. The same component is used by every surface; only the surrounding
// differs. `activator` stays on so clicking the body activates this context (it
// takes over the browser URL).
const props = defineProps<{ panel: Panel }>()
const { setTitle, contextName, setLocation } = usePanels()

const name = computed(() => contextName(props.panel))

// Start the context at the panel's stored location, captured once: feeding the
// live location back into the prop would remount the context (location is part of
// its key) on every in-panel navigation — losing focus mid-edit. Instead we keep
// the prop fixed and persist live navigation via update:location, so edits in the
// panel (e.g. a card's query) survive reload without remounting.
const initialLocation = props.panel.location

// The routed content exposes its title via defineExpose; mirror it into the
// panel store so any host (drawer header, window title bar, future hosts)
// can show it without reaching into this subtree.
const content = ref<{ title?: string } | null>(null)
const title = computed(() => content.value?.title)
watch(title, (value) => setTitle(props.panel.id, value), { immediate: true })
</script>

<template>
  <!-- activator off: the routed content can be fragment-rooted (the built-in
       activator can't attach to that), so each host activates the panel itself
       on pointer-down (DrawerPanel / FloatingWindow). -->
  <MultiRouterContext
    type="panel"
    :name="name"
    :location="initialLocation"
    :activator="false"
    @update:location="(loc) => setLocation(panel.id, loc)"
  >
    <RouterView v-slot="{ Component }">
      <component :is="Component" ref="content" />
    </RouterView>
  </MultiRouterContext>
</template>
