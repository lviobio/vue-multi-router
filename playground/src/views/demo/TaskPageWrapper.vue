<script setup lang="ts">
import { ref } from 'vue'
import { NH1 } from 'naive-ui'
import { type Task } from './tasks'
import { useRoute } from 'vue-router'
import { ArrowLeft16Regular } from '@vicons/fluent'

const route = useRoute()

const task = ref<Task>()
</script>

<template>
  <div v-if="route.name !== 'tasks'">
    <NH1>{{ task?.title ?? 'Task' }}</NH1>
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-model:task="task" />
    </RouterView>
  </div>
  <div v-else>There is no page with all tasks, use "Peek" demo instead.</div>
  <p class="mt-4">
    <RouterLink to="/demo/peek">
      <NButton size="small" quaternary circle text>
        <template #icon>
          <NIcon><ArrowLeft16Regular /></NIcon>
        </template>
        <span>All tasks</span>
      </NButton>
    </RouterLink>
  </p>
</template>
