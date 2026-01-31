<script setup lang="ts">
import { useMultiRouter } from '../../../../src'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const { activeContextKey, activeContext } = useMultiRouter()

const router = useRouter()

const displayUrl = computed(() => {
  return activeContext.value?.data?.router?.currentRoute?.value?.fullPath
})
// // Track URL for active context
// const displayUrl = ref('/')
//
// // Update display URL when route changes
// watch(
//   () => route.fullPath,
//   (fullPath) => {
//     console.log('asd')
//     displayUrl.value = fullPath
//   },
//   { immediate: true },
// )

function goBack() {
  router.back()
}

function goForward() {
  router.forward()
}
</script>

<template>
  <div class="browser-frame">
    <div class="browser-toolbar">
      <div class="browser-window-buttons">
        <span class="window-btn close"></span>
        <span class="window-btn minimize"></span>
        <span class="window-btn maximize"></span>
      </div>
      <div class="browser-nav-buttons">
        <button class="browser-btn" @click="goBack" title="Back">←</button>
        <button class="browser-btn" @click="goForward" title="Forward">→</button>
      </div>
      <div class="browser-address-bar">
        <span class="browser-url"> <span class="url-base">myapp.com</span>{{ displayUrl }} </span>
      </div>
      <div class="browser-context-indicator" v-if="activeContextKey">
        <span class="context-badge">{{ activeContextKey }}</span>
      </div>
    </div>
    <div class="browser-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.browser-frame {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  background: var(--vp-c-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.browser-window-buttons {
  display: flex;
  gap: 8px;
}

.window-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.window-btn.close {
  background: #ff5f57;
}

.window-btn.minimize {
  background: #febc2e;
}

.window-btn.maximize {
  background: #28c840;
}

.browser-nav-buttons {
  display: flex;
  gap: 2px;
}

.browser-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1;
  transition:
    background 0.15s,
    color 0.15s;
}

.browser-btn:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.browser-btn:active {
  background: var(--vp-c-default-3);
}

.browser-address-bar {
  flex: 1;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 6px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  overflow: hidden;
}

.browser-url {
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.url-base {
  color: var(--vp-c-text-3);
}

.browser-context-indicator {
  flex-shrink: 0;
  align-self: center;
}

.context-badge {
  display: inline-block;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
  font-family: var(--vp-font-family-mono);
  min-width: 64px;
  text-align: center;
  box-sizing: border-box;
}

.browser-content {
  min-height: 200px;
  background: var(--vp-c-bg-alt);
}
</style>
