<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
</script>

<template>
  <main>
    <h1>Basic Navigation</h1>

    <MultiRouterContext type="panel" name="panel-nav" initial-location="/page-a" :activator="false">
      <div class="panel">
        <nav class="page-links">
          <RouterLink data-testid="go-page-a" to="/page-a">Page A</RouterLink>
          <RouterLink data-testid="go-page-b" to="/page-b">Page B</RouterLink>
        </nav>

        <RouterView />
      </div>
    </MultiRouterContext>
  </main>
</template>
