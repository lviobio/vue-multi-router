<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import TaskDetails from './TaskDetails.vue'
import { tasks, type Task } from './tasks'
import { NText } from 'naive-ui'

const route = useRoute()

defineExpose({ title: computed(() => task.value?.title ?? 'Task') })

const task = defineModel<Task>('task')

watchEffect(() => {
  task.value = tasks.find((t) => t.id === Number(route.params.id))
})
</script>

<template>
  <TaskDetails v-if="task" :task="task" />
  <NText v-else depth="3">Task not found.</NText>
</template>
