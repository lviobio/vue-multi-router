<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NDrawer } from 'naive-ui'
import { MultiRouterContextActivator, useMultiRouterContext } from '../../../src'
import { useDrawerStack } from '../composables/useDrawerStack'
import DrawerLevel from './DrawerLevel.vue'

// This component renders inside the drawer context router.
const router = useRouter()
const { activeHistoryContextKey, manager, setActive } = useMultiRouterContext()

const { chain, seed, closeTo, closeTop, checkContext, depthOf, isRestoredActive } = useDrawerStack()
// Rebuild the stack depth from persisted state before the levels render.
seed(manager)

// The drawer is open while it — or any of its stacked child drawers — owns the
// browser history. Tracking the whole family keeps the base drawer visible while
// a peeked task is stacked on top.
const isFamilyActive = computed(() => checkContext(activeHistoryContextKey.value ?? ''))

// On reload `isFamilyActive` only turns reactive after the async restore, so seed
// `restoredOpen` synchronously from storage: the drawer paints open on the first
// frame (also skipping NDrawer's enter animation, whose `appear` only kicks in
// after mount). Cleared once the router is ready and `isFamilyActive` takes over.
const restoredOpen = ref(isRestoredActive(manager))
onMounted(async () => {
  await router.isReady()
  restoredOpen.value = false
})

const show = computed({
  get: () => isFamilyActive.value || restoredOpen.value,
  // Flipped to false by a mask click, Esc on the base, or a content close button.
  set: (open) => {
    if (!open) {
      restoredOpen.value = false
      setActive('main')
    }
  },
})

// The base drawer is the topmost only when nothing is stacked above it — drives focus.
const isTopmost = computed(() => chain.value.length === 0)

// Follow browser back/forward: when the active drawer moves up the stack, drop the
// deeper levels so they unmount in step with the URL.
watch(activeHistoryContextKey, (active) => {
  if (active && checkContext(active)) closeTo(depthOf(active), manager)
})

// Esc closes a single drawer — the topmost. naive's own close-on-esc is disabled
// on every level (after a reload its focus-trap stack is off and it dispatches to
// the wrong/all drawers), so we close the deepest level ourselves — or the base
// drawer when nothing is stacked.
function onEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !show.value) return
  if (chain.value.length > 0) closeTop(manager)
  else show.value = false
}
onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))
</script>

<template>
  <NDrawer
    v-model:show="show"
    :width="502"
    placement="left"
    :z-index="2000"
    :close-on-esc="false"
    :auto-focus="isTopmost"
  >
    <MultiRouterContextActivator>
      <DrawerLevel />
    </MultiRouterContextActivator>
  </NDrawer>
</template>
