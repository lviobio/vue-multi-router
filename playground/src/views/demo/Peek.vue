<script setup lang="ts">
import { NButton, NH1, NTable, NText } from 'naive-ui'
import { tasks } from './tasks'
</script>

<template>
  <div>
    <NH1>Peek Demo</NH1>

    <NText depth="2">
      Open a task to peek at it in the shared app drawer. The drawer lives in its own router
      context, so its state survives a reload — open a task and refresh the page: the drawer reopens
      on top of the table. Open the same URL in a new tab (empty session storage) and the task
      renders as a standalone page instead.
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
              :to="{ name: 'tasks.show', params: { id: task.id }, drawer: true }"
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
