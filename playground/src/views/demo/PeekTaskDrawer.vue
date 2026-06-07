<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NDrawer } from 'naive-ui'
import { MultiRouterContextActivator, useMultiRouterContext } from '../../../../src'

// Resolves to the "peek-drawer" context router (this component is rendered
// inside its MultiRouterContext)
const router = useRouter()
const route = useRoute()

const { setActive } = useMultiRouterContext()

// The drawer is open whenever the context's route points at a task
const show = computed({
  get: () => !!route.params.id,
  set: (value) => {
    if (!value) {
      // Hand the active context back to "main" first, so the browser URL
      // returns to the table page; the drawer context then records its
      // closed state in the virtual stack without touching browser history
      setActive('main')
      router.push('/demo/peek')
    }
  },
})
</script>

<template>
  <NDrawer v-model:show="show" :width="502" placement="left">
    <!-- v-if: while the drawer animates out, its route already points at the
         table page — don't let the RouterView render that page inside -->
    <MultiRouterContextActivator v-if="show">
      <RouterView />
    </MultiRouterContextActivator>
  </NDrawer>
</template>
