<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import { useMultiRouter } from '../../../../src'
import { usePanels, type Panel } from '../../composables/usePanels'
import PanelView from './PanelView.vue'
import PanelHeader from './PanelHeader.vue'

// One modeless, draggable window. Position/size/z live in the panel store, so a
// drag survives reload and clicking raises the window to the front (and makes its
// context active). A custom positioned container rather than NModal: NModal is a
// single-at-a-time modal primitive (mask + focus trap) and its draggable offset
// can't be persisted — neither fits a multi-window, position-remembering surface.
const props = defineProps<{ panel: Panel }>()

const { manager, activeContextKey } = useMultiRouter()
const { focus, setRect, contextName } = usePanels()

// Highlight the window like a Card when its context owns the URL.
const isActive = computed(() => activeContextKey.value === contextName(props.panel))

const style = computed(() => ({
  left: `${props.panel.meta.rect.x}px`,
  top: `${props.panel.meta.rect.y}px`,
  width: `${props.panel.meta.rect.w}px`,
  zIndex: props.panel.z + 1,
}))

// --- dragging by the title bar ---
let dragging = false
let startX = 0
let startY = 0
let originX = 0
let originY = 0

function onBarPointerDown(e: PointerEvent) {
  // Let header buttons (move / expand / close) work without starting a drag.
  if ((e.target as HTMLElement).closest('.panel-actions')) return
  dragging = true
  startX = e.clientX
  startY = e.clientY
  originX = props.panel.meta.rect.x
  originY = props.panel.meta.rect.y
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onBarPointerMove(e: PointerEvent) {
  if (!dragging) return
  // Live-update geometry without persisting on every move…
  setRect(
    props.panel.id,
    { x: originX + (e.clientX - startX), y: originY + (e.clientY - startY) },
    { persist: false },
  )
}

function onBarPointerUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  setRect(props.panel.id, {}, { persist: true }) // …commit once on drag end
}
</script>

<template>
  <div class="floating-window" :style="style" @pointerdown="focus(panel.id, manager)">
    <NCard
      size="small"
      :bordered="true"
      content-style="max-height: 60vh; overflow: auto;"
      :theme-overrides="{ borderColor: isActive ? 'var(--color-green-600)' : undefined }"
    >
      <template #header>
        <div
          class="drag-bar"
          @pointerdown="onBarPointerDown"
          @pointermove="onBarPointerMove"
          @pointerup="onBarPointerUp"
        >
          <PanelHeader :panel="panel" :title="panel.meta.title" />
        </div>
      </template>
      <PanelView :panel="panel" />
    </NCard>
  </div>
</template>

<style scoped>
.floating-window {
  position: absolute;
  pointer-events: auto;
}
.floating-window :deep(.n-card) {
  box-shadow:
    0 6px 16px -8px rgba(0, 0, 0, 0.18),
    0 9px 28px 0 rgba(0, 0, 0, 0.12);
}
.drag-bar {
  cursor: move;
  user-select: none;
}
</style>
