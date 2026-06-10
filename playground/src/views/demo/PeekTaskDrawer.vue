<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NDrawer } from 'naive-ui'
import { MultiRouterContextActivator, useMultiRouterContext } from '../../../../src'

// Resolves to the "peek-drawer" context router (this component is rendered
// inside its MultiRouterContext)
const router = useRouter()
const route = useRoute()

const { setActive } = useMultiRouterContext()

// On reload the context router restores its location synchronously, but its
// async initial navigation means `route.params.id` is still empty on the first
// render — so the drawer would paint closed and then flip open, replaying the
// open animation. Seed the open state from the restored history location (read
// synchronously off the proxy history) so the drawer paints open on the very
// first frame. Because NDrawer only `appear`s its enter transition after mount,
// rendering open from frame one skips the animation entirely — no flicker.
const restoredOpen = ref(!!router.resolve(router.options.history.location).params.id)
onMounted(async () => {
  // Once the router has caught up, route.params.id is authoritative; drop the
  // seed so closing the drawer (params cleared) reflects immediately.
  await router.isReady()
  restoredOpen.value = false
})

// The drawer is open whenever the context's route points at a task (or, during
// the initial restore gap, when the restored location already did)
const show = computed({
  get: () => !!route.params.id || restoredOpen.value,
  set: (value) => {
    if (!value) {
      restoredOpen.value = false
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
