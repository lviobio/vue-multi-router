<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { NButton, NH1, NTable, NText } from 'naive-ui'
import { MultiRouterContext, useMultiRouter } from '../../../../src'
import PeekTaskDrawer from './PeekTaskDrawer.vue'
import { peekTasks } from './peekTasks'

const { manager, hasContext, setActive, activeContextKey } = useMultiRouter()

const contextName = 'peek-drawer'

async function openTask(id: number) {
  if (!hasContext(contextName)) return
  // Activate first, then navigate: the click is one user action and should
  // produce a single history entry — the previous entry keeps the closed state
  setActive(contextName)
  await manager.getRouter(contextName).push({ name: 'task', params: { id } })
}

// Thanks to keep-history the drawer context survives this page unmounting
// (e.g. after expanding a task to the standalone page). If it comes back in
// an open state — browser back from the expanded task — make it the active
// context again, like right after clicking Open.
onMounted(async () => {
  if (!hasContext(contextName)) return
  const router = manager.getRouter(contextName)

  // A closed drawer means the table owns the screen: when a history
  // navigation closes the drawer while its context is active (browser back
  // onto an entry holding the closed state), hand the activation to main.
  // Watching the open → closed transition (not the combined state) avoids
  // firing on transients while an open/close navigation is still in flight.
  watch(
    () => router.currentRoute.value.params.id as string | undefined,
    (id, prevId) => {
      if (prevId && !id && activeContextKey.value === contextName) {
        setActive('main')
      }
    },
  )

  // The context router is still running its initial navigation at this point
  await router.isReady()
  if (router.currentRoute.value.params.id) {
    setActive(contextName)
  }
})
</script>

<template>
  <div>
    <NH1>Peek Demo</NH1>

    <NText depth="2">
      Open a task to peek at it in a drawer. The drawer lives in its own router context, so its
      state survives a reload — open a task and refresh the page: the drawer reopens on top of the
      table. Open the same URL in a new tab (empty session storage) and the task renders as a
      standalone page instead.
    </NText>
    <p>
      <NText depth="3">All data is stored in session storage.</NText>
    </p>

    <NTable class="mt-6 max-w-2xl" :single-line="false">
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Deadline</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in peekTasks" :key="task.id">
          <td>{{ task.id }}</td>
          <td>{{ task.title }}</td>
          <td>{{ task.deadline }}</td>
          <td>
            <NButton size="small" @click="openTask(task.id)">Open</NButton>
          </td>
        </tr>
      </tbody>
    </NTable>

    <MultiRouterContext
      type="drawer"
      :name="contextName"
      initial-location="/demo/peek"
      keep-history
      :activator="false"
    >
      <PeekTaskDrawer />
    </MultiRouterContext>
  </div>
</template>
