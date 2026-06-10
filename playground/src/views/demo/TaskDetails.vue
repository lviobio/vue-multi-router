<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NText } from 'naive-ui'
import { type Task, tasks } from './tasks'

const props = defineProps<{
  task: Task
}>()

const related = computed(() =>
  props.task.related.map((id) => tasks.find((t) => t.id === id)).filter((t): t is Task => !!t),
)
</script>

<template>
  <p>
    <NText depth="2">{{ task.description }}</NText>
  </p>
  <p>
    <NText depth="3">ID: {{ task.id }} · Deadline: {{ task.deadline }}</NText>
  </p>

  <template v-if="related.length">
    <p class="mt-4">
      <NText depth="3">Related tasks</NText>
    </p>
    <ul class="related">
      <li v-for="rel in related" :key="rel.id">
        <RouterLink
          :to="{ name: 'tasks.show', params: { id: rel.id }, drawer: true }"
          #="{ navigate, href }"
          custom
        >
          <NButton text type="primary" tag="a" :href="href" @click="navigate">{{
            rel.title
          }}</NButton>
        </RouterLink>
      </li>
    </ul>
  </template>
</template>

<style scoped>
.related {
  margin: 4px 0 0;
  padding-left: 18px;
}
.related li {
  margin: 2px 0;
}
</style>
