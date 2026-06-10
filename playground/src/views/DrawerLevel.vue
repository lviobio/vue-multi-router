<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NDrawer, NDrawerContent } from 'naive-ui'
import { MultiRouterContext, useMultiRouterContext } from '../../../src'
import { useDrawerStack } from '../composables/useDrawerStack'

// One level of the stacked drawer. It wraps the routed content in an
// NDrawerContent whose header title comes from the content's `defineExpose`, and
// renders the next stacked level (a nested router context) when the stack reaches
// deeper than it. Recurses into itself for that child level.
const route = useRoute()
const { manager, depth, setActive } = useMultiRouterContext()

const childName = `drawer-${depth + 1}`
const childWidth = Math.max(502 - (depth + 1) * 40, 300)

// `chain[depth]` is the location stacked on top of this level (null → restore it
// from its own keep-history after a reload). Forcing the location (rather than
// initial-location) re-keys the nested context when the stacked task changes, so
// closing and re-opening at a different task shows the new one, not a stale save.
const { chain, closeTo } = useDrawerStack()
const showChild = computed(() => chain.value.length > depth)
const childLocation = computed(() => chain.value[depth] ?? undefined)
const childIsTopmost = computed(() => chain.value.length === depth + 1)

const childShow = computed({
  get: () => showChild.value,
  set: (value) => {
    if (!value) closeTo(depth, manager)
  },
})

// Drawer header title from the routed content's defineExpose (undefined → no title).
const content = ref<{ title?: string } | null>(null)
const title = computed(() => content.value?.title)

// Any task drawer (at any nesting level) can promote its own task to a standalone page.
const canExpand = computed(() => route.name === 'tasks.show')
async function expandToPage() {
  // Navigate main first (while inactive — no browser entry), then activate: the
  // URL already shows this task, so it's a replace, leaving one back step to the
  // page the drawer was opened from.
  await manager.getRouter('main').push({ name: 'tasks.show', params: { id: route.params.id } })
  setActive('main')
}
</script>

<template>
  <NDrawerContent :title="title" closable>
    <template v-if="canExpand" #header>
      <div class="flex items-center gap-3">
        <span>{{ title }}</span>
        <NButton size="tiny" tertiary @click="expandToPage">Expand</NButton>
      </div>
    </template>

    <RouterView v-slot="{ Component }">
      <component :is="Component" ref="content" />
    </RouterView>

    <!-- Next level, stacked on top as its own router context (recursive).
         close-on-esc is off on every level (after a reload naive's focus-trap Esc
         dedup breaks for simultaneously-mounted drawers); AppDrawerContent owns a
         single Esc handler that closes the topmost level instead. -->
    <NDrawer
      v-model:show="childShow"
      :width="childWidth"
      :z-index="2001 + depth"
      placement="left"
      :close-on-esc="false"
      :auto-focus="childIsTopmost"
    >
      <MultiRouterContext
        v-if="showChild"
        type="drawer"
        :name="childName"
        :location="childLocation"
        keep-history
        :activator="false"
      >
        <DrawerLevel />
      </MultiRouterContext>
    </NDrawer>
  </NDrawerContent>
</template>
