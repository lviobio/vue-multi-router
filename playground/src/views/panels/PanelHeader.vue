<script setup lang="ts">
import { computed, inject } from 'vue'
import { NButton } from 'naive-ui'
import { useMultiRouter } from '../../../../src'
import { surfaceMetas } from '../../composables/surface-meta'
import { panelCloseKey, usePanels, type Panel } from '../../composables/usePanels'
import { CloseIcon } from 'naive-ui/es/_internal/icons'

// Shared header for every surface: the title plus the universal panel
// actions. The "→ {label}" buttons are generated from the surface registry, so a
// newly-registered third surface gets a move target for free.
const props = defineProps<{ panel: Panel; title?: string }>()

const { manager } = useMultiRouter()
const { moveTo, close } = usePanels()

const otherSurfaces = computed(() => surfaceMetas.filter((s) => s.id !== props.panel.surface))

// Let the host animate itself out if it can (the drawer slides closed); otherwise
// drop the panel immediately (floating windows just disappear).
const requestClose = inject(panelCloseKey, () => close(props.panel.id))

function moveTo_(id: string) {
  moveTo(props.panel.id, id, manager)
}

// Promote the panel to a full standalone page in the main shell, then close it —
// one back-step returns to where it was opened (mirrors the old drawer "Expand").
async function expand() {
  await manager.getRouter('main').push(props.panel.location)
  manager.setActive('main', true)
  requestClose()
}
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <span class="font-medium truncate">{{ title }}</span>
    <div class="panel-actions ml-auto flex items-center gap-1">
      <NButton v-for="s in otherSurfaces" :key="s.id" size="tiny" tertiary @click="moveTo_(s.id)">
        → {{ s.label }}
      </NButton>
      <NButton size="tiny" tertiary @click="expand">Expand</NButton>
      <NButton size="tiny" quaternary circle @click="requestClose">
        <NIcon><CloseIcon /></NIcon>
      </NButton>
    </div>
  </div>
</template>
