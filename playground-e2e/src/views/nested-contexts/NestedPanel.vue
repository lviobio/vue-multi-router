<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MultiRouterContext, useMultiRouterContext } from 'vue-multi-router'
import { useNestedStack } from './nestedStack'

// Route component for /np/:id, rendered inside a context. It can open a deeper
// nested context (a child panel) — each level is its own MultiRouterContext, so
// the library's parent↔child support drives activation, fallback and restore.
const route = useRoute()
const { contextKey, parentKey, depth, setActive, hasContext } = useMultiRouterContext()

const id = computed(() => Number(route.params.id))

// `depth` comes from the library (it counts every ancestor context). The base
// panel `np` sits one level under the app's `main` context, so depth starts at
// 1 here; panelDepth re-bases it to the nesting under `np` (0, 1, 2, …) for the
// child names and the persisted stack index.
const panelDepth = computed(() => depth - 1)
const childName = computed(() => `np-${panelDepth.value + 1}`)

const { childOf, openChild, closeSelf } = useNestedStack()
const childId = computed(() => childOf(panelDepth.value))

// Activate the freshly-registered child so it owns the browser URL. On reload
// the persisted stack is already present, so this also drives the restore.
// NOTE: there is deliberately NO manual re-activation on close — when the child
// context unregisters the library hands activation back to this (parent) context.
watch(
  childId,
  async (cid) => {
    if (cid === null) return
    await nextTick()
    if (hasContext(childName.value)) setActive(childName.value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="panel" :data-testid="`panel-${contextKey}`">
    <div class="panel-header">
      <strong :data-testid="`name-${contextKey}`">{{ contextKey }}</strong>
    </div>
    <dl class="context-status">
      <dt>id</dt>
      <dd :data-testid="`id-${contextKey}`">{{ id }}</dd>
      <dt>depth</dt>
      <dd :data-testid="`depth-${contextKey}`">{{ depth }}</dd>
      <dt>parent</dt>
      <dd :data-testid="`parent-${contextKey}`">{{ parentKey ?? 'none' }}</dd>
    </dl>
    <button :data-testid="`open-${contextKey}`" @click="openChild(panelDepth, id + 1)">
      Open child
    </button>
    <!-- Close lives inside the panel's own context (like a drawer's X button),
         so closing it doesn't first re-activate an ancestor. Removing the
         context lets the library hand activation back to the parent. -->
    <button
      v-if="panelDepth > 0"
      :data-testid="`close-${contextKey}`"
      @click="closeSelf(panelDepth)"
    >
      Close
    </button>

    <MultiRouterContext
      v-if="childId !== null"
      :key="childId"
      type="panel"
      :name="childName"
      :initial-location="`/np/${childId}`"
    >
      <RouterView />
    </MultiRouterContext>
  </div>
</template>
