<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
import PanelRouteGuard from './components/PanelRouteGuard.vue'

// Opt-in per test: the guard redirects panel-only URLs home, which would
// interfere with fixtures that deep-link into panel routes on purpose.
// Tests enable it via page.addInitScript before navigation.
const panelRouteGuardEnabled = localStorage.getItem('e2e-panel-route-guard') === '1'

const routes = [
  { to: '/basic-navigation', label: 'Basic Navigation' },
  { to: '/context-switching', label: 'Context Switching' },
  { to: '/activator', label: 'Activator' },
  { to: '/url-sync', label: 'URL Sync' },
  { to: '/dynamic-panels', label: 'Dynamic Panels' },
  { to: '/activate-hook', label: 'Activate Hook' },
  { to: '/location-control', label: 'Location Control' },
  { to: '/nested-host', label: 'Nested Routes' },
  { to: '/stabilization', label: 'Stabilization' },
  { to: '/edge-cases', label: 'Edge Cases' },
]
</script>

<template>
  <!-- Built-in activator enabled (like the demo playground): mousedown on empty
       space activates the main context; nested contexts stop propagation -->
  <MultiRouterContext type="main" name="main" default>
    <div class="layout">
      <PanelRouteGuard v-if="panelRouteGuardEnabled" />
      <nav class="nav">
        <span class="nav-title">e2e fixtures</span>
        <div class="nav-links">
          <RouterLink
            v-for="r in routes"
            :key="r.to"
            :to="r.to"
            :data-testid="`nav-${r.to.slice(1)}`"
            class="nav-link"
            active-class="nav-link--active"
          >
            {{ r.label }}
          </RouterLink>
        </div>
      </nav>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </MultiRouterContext>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 14px;
  background: #f7f7f8;
  color: #1a1a1a;
}

input,
button {
  font-family: inherit;
  font-size: 13px;
}

button {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

button:hover {
  background: #f0f0f0;
}

input {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px #6366f120;
}

/* Shared fixture styles */
.panels {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 260px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.context-status {
  display: grid;
  grid-template-columns: auto auto;
  gap: 2px 8px;
  margin: 0;
  font-size: 12px;
  color: #71717a;
}

.context-status dt {
  font-weight: 500;
}

.context-status dd {
  margin: 0;
  font-family: monospace;
}

.query-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.query-page code {
  font-size: 12px;
  color: #52525b;
  word-break: break-all;
}

.page-links {
  display: flex;
  gap: 8px;
}
</style>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.nav {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 20px;
  height: 44px;
  background: #18181b;
  color: #e4e4e7;
  flex-shrink: 0;
}

.nav-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #71717a;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 5px 10px;
  border-radius: 5px;
  color: #a1a1aa;
  text-decoration: none;
  font-size: 13px;
  transition:
    color 0.15s,
    background 0.15s;
}

.nav-link:hover {
  color: #e4e4e7;
  background: #27272a;
}

.nav-link--active {
  color: #e4e4e7;
  background: #3f3f46;
}

.content {
  padding: 28px 24px;
  flex: 1;
}
</style>
