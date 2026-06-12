<script setup lang="ts">
import { NButton, NH1, NTable, NText } from 'naive-ui'
import { tasks } from './tasks'
</script>

<template>
  <div>
    <NH1>Peek Demo</NH1>

    <NText depth="2">
      Open a task to peek at it as a panel. Each panel is its own router context, so many can be
      open at once. Use the panel header to move it between surfaces — dock it as a drawer or detach
      it into a free-floating, draggable window (open several!) — or Expand it to a full page. Panel
      state, positions and which surface each lives on survive a reload.
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
        <tr v-for="task in tasks" :key="task.id">
          <td>{{ task.id }}</td>
          <td>{{ task.title }}</td>
          <td>{{ task.deadline }}</td>
          <td>
            <RouterLink
              :to="{ name: 'tasks.show', params: { id: task.id }, panel: 'drawer' }"
              #="{ navigate, href }"
              custom
            >
              <NButton size="small" tag="a" :href="href" @click="navigate">Open</NButton>
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </NTable>
  </div>
</template>
