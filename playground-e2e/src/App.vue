<script setup lang="ts">
import { MultiRouterContext } from 'vue-multi-router'
</script>

<template>
  <MultiRouterContext type="main" name="main" default :activator="false">
    <RouterView />
  </MultiRouterContext>
</template>
