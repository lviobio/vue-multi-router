<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NDrawerContent, NH1, NLayout, NLayoutContent } from 'naive-ui'
import { useMultiRouterContext } from '../../../../src'
import AppHeader from '../AppHeader.vue'
import PeekTaskDetails from './PeekTaskDetails.vue'
import { peekTasks } from './peekTasks'

const route = useRoute()

// The same route component serves two contexts: inside the "peek-drawer"
// context it renders as drawer content, while in the "main" context (direct
// link to /task/:id with empty session storage) it renders as a standalone page
const { contextKey, manager, setActive } = useMultiRouterContext()
const inDrawer = contextKey !== 'main'

const task = computed(() => peekTasks.find((t) => t.id === Number(route.params.id)))

// The drawer context keeps its history while unmounted (keep-history), so
// browser back from here reopens the task in the drawer. "All tasks" means
// "show me the list" — drop the kept history so the drawer stays closed.
function resetDrawer() {
  manager.getHistoryManager().removeContextHistory('peek-drawer')
}

// Promote the task from the drawer to the standalone page: the main context
// navigates to the task URL itself, rendering the same view as a direct link.
// Activating main first deliberately records a /demo/peek entry in between, so
// browser back from the expanded page returns to the table — where keep-history
// reopens the task in the drawer. The Peek page (and the drawer context with
// it) unmounts along the way.
async function expandToPage() {
  setActive('main')
  await manager.getRouter('main').push({ name: 'task', params: { id: route.params.id } })
}
</script>

<template>
  <NDrawerContent v-if="inDrawer" closable>
    <template #header>
      <div class="flex items-center gap-3">
        <span>{{ task?.title ?? 'Task' }}</span>
        <NButton v-if="task" size="tiny" tertiary @click="expandToPage">Expand</NButton>
      </div>
    </template>
    <PeekTaskDetails :task="task" />
  </NDrawerContent>
  <NLayout v-else>
    <AppHeader />
    <NLayoutContent content-style="padding: 24px;" content-class="h-screen!">
      <NH1>{{ task?.title ?? 'Task' }}</NH1>
      <PeekTaskDetails :task="task" />
      <p class="mt-4">
        <RouterLink to="/demo/peek" @click="resetDrawer">← All tasks</RouterLink>
      </p>
    </NLayoutContent>
  </NLayout>
</template>
