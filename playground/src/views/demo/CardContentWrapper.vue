<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})
</script>
<template>
  <div>
    <p>
      <span>This is a wrapper component!</span>
      <span>You can't see this text because CardContent</span>
      <span>route has multiRouterRoot meta set to true.</span>
    </p>
    <RouterView v-bind="$attrs" />
  </div>
</template>
