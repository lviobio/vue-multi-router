<script setup lang="ts">
import { NText } from 'naive-ui'
import type { PeekTask } from './peekTasks'

defineProps<{
  task?: PeekTask
}>()
</script>

<template>
  <template v-if="task">
    <p>
      <NText depth="2">{{ task.description }}</NText>
    </p>
    <p>
      <NText depth="3">ID: {{ task.id }} · Deadline: {{ task.deadline }}</NText>
    </p>
  </template>
  <NText v-else depth="3">Task not found.</NText>
</template>
