<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMultiRouterContext } from '../../../../src'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  title: string
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { isActive, activate } = useMultiRouterContext()

const router = useRouter()
const route = useRoute()

const inputValue = ref('')

const pages = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/settings', label: 'Settings' },
]

// Sync input with query params
watch(inputValue, (val) => {
  router.push({
    path: route.path,
    query: val ? { q: val } : {},
  })
})

watch(
  () => route.query.q,
  (q) => {
    inputValue.value = (q as string) || ''
  },
  { immediate: true },
)

function navigateTo(path: string) {
  router.push({ path, query: route.query })
}
</script>

<template>
  <div class="demo-card" :class="{ active: isActive }" @click="activate">
    <div class="card-header">
      <span class="card-title">{{ title }}</span>
      <button v-if="closable" class="card-close" @click.stop="emit('close')">×</button>
    </div>

    <div class="card-nav">
      <button
        v-for="page in pages"
        :key="page.path"
        class="nav-btn"
        :class="{ active: route.path === page.path }"
        @click.stop="navigateTo(page.path)"
      >
        {{ page.label }}
      </button>
    </div>

    <div class="card-input">
      <input v-model="inputValue" type="text" placeholder="Type to change query..." @click.stop />
    </div>

    <div class="card-route">
      {{ route.fullPath }}
    </div>
  </div>
</template>

<style scoped>
.demo-card {
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.demo-card:hover {
  border-color: var(--vp-c-brand-soft);
}

.demo-card.active {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px var(--vp-c-brand-1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.card-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--vp-c-text-3);
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  border-radius: 4px;
  transition:
    color 0.15s,
    background 0.15s;
}

.card-close:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft);
}

.card-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.nav-btn {
  flex: 1;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.nav-btn.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.card-input {
  margin-bottom: 8px;
}

.card-input input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 12px;
}

.card-input input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.card-route {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 4px 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
