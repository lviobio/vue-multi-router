<script setup lang="ts">
import { onMounted, provide, ref } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { useMultiRouter } from '../../../../src'
import { panelCloseKey, usePanels, type Panel } from '../../composables/usePanels'
import PanelView from './PanelView.vue'
import PanelHeader from './PanelHeader.vue'

// One drawer-hosted panel. `show` opens on mount so the drawer plays its slide-in
// (naive only animates a false→true change, not a drawer that starts shown), and
// closing flips it back so the slide-out runs before the panel is dropped.
// display-directive="show" keeps the content mounted while hidden, so the panel's
// router context registers right away and `open()` can activate it immediately —
// rather than a tick later once the drawer finishes opening.
const props = defineProps<{ panel: Panel; width: number; zIndex: number }>()
const { manager } = useMultiRouter()
const { close, wasRestored, contextName } = usePanels()

// Clicking anywhere in the drawer makes its context active (it takes over the
// URL). Drawers keep their cascade order, so — unlike windows — this doesn't
// reorder them.
function activate() {
  manager.setActive(contextName(props.panel), true)
}

// Fresh panels mount closed then open (slide-in); panels restored from a previous
// session mount already-open so the first frame shows them without animation.
const show = ref(wasRestored(props.panel.id))
onMounted(() => {
  show.value = true
})

// The header's close button (and Expand) route through this so the drawer
// animates out; afterLeave then removes the panel.
provide(panelCloseKey, () => {
  show.value = false
})

function afterLeave() {
  close(props.panel.id)
}
</script>

<template>
  <NDrawer
    :show="show"
    :width="width"
    placement="left"
    :z-index="zIndex"
    display-directive="show"
    :show-mask="false"
    :mask-closable="false"
    :close-on-esc="false"
    :trap-focus="false"
    @update:show="(open: boolean) => !open && (show = false)"
    @after-leave="afterLeave"
  >
    <NDrawerContent @mousedown="activate">
      <template #header>
        <PanelHeader :panel="panel" :title="panel.meta.title" />
      </template>
      <PanelView :panel="panel" />
    </NDrawerContent>
  </NDrawer>
</template>
