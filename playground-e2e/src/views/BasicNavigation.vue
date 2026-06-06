<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
</script>

<template>
  <main>
    <h1>Basic Navigation</h1>

    <MultiRouterContext
      type="panel"
      name="panel-nav"
      initial-location="/page-a"
      :activator="false"
    >
      <div>
        <nav style="display: flex; gap: 8px; margin-bottom: 12px">
          <router-link data-testid="go-page-a" to="/page-a">Page A</router-link>
          <router-link data-testid="go-page-b" to="/page-b">Page B</router-link>
        </nav>

        <RouterView />
      </div>
    </MultiRouterContext>
  </main>
</template>
