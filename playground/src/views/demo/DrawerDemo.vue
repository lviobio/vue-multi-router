<script setup lang="ts">
import { NButton, NH1, NSpace, NText } from 'naive-ui'
</script>

<template>
  <div>
    <NH1>Universal Drawer Demo</NH1>

    <NText depth="2">
      The drawer is one app-level component shared across the whole app. Any route can be opened
      inside it from anywhere — its content and open state survive a reload, and browser back closes
      it.
    </NText>
    <p>
      <NText depth="3">Close it via the mask, Esc, or a content close button.</NText>
    </p>

    <NSpace class="mt-6">
      <RouterLink
        :to="{ name: 'tasks.show', params: { id: 1 }, drawer: true }"
        #="{ navigate, href }"
        custom
      >
        <NButton tag="a" :href="href" @click="navigate">Open task 1</NButton>
      </RouterLink>
      <RouterLink
        :to="{ name: 'tasks.show', params: { id: 2 }, drawer: true }"
        #="{ navigate, href }"
        custom
      >
        <NButton tag="a" :href="href" @click="navigate">Open task 2</NButton>
      </RouterLink>
      <RouterLink
        :to="{ path: '/demo/cards/wrapper/content', drawer: true }"
        #="{ navigate, href }"
        custom
      >
        <NButton tag="a" :href="href" @click="navigate">Open card</NButton>
      </RouterLink>
    </NSpace>
  </div>
</template>
