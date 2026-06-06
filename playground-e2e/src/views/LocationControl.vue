<script setup lang="ts">
import { ref } from 'vue'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { MultiRouterContext } from 'vue-multi-router'

// Controlled string location (two-way via v-model:location)
const strLocation = ref('/page-a')

// Controlled object location (named route) with a manual update:location listener
const objLocation = ref<RouteLocationRaw>({ name: 'panel-page-a' })
const objEmitted = ref<RouteLocationNormalized | null>(null)
</script>

<template>
  <main>
    <h1>Location Control</h1>

    <div class="toolbar">
      <button data-testid="set-str-page-b" @click="strLocation = '/page-b'">
        Set string location to /page-b
      </button>
      <button data-testid="set-obj-page-b" @click="objLocation = { name: 'panel-page-b' }">
        Set object location to panel-page-b
      </button>
    </div>

    <p>
      String model:
      <code data-testid="str-location">{{ strLocation }}</code>
    </p>
    <p>
      Emitted object:
      <code data-testid="obj-emitted-fullpath">{{ objEmitted?.fullPath ?? 'none' }}</code>
      (type:
      <span data-testid="obj-emitted-type">{{
        objEmitted === null ? 'null' : typeof objEmitted
      }}</span
      >)
    </p>

    <div class="panels">
      <MultiRouterContext
        type="panel"
        name="loc-str"
        :activator="false"
        v-model:location="strLocation"
      >
        <section class="panel" data-testid="loc-str-panel">
          <strong>String location (v-model)</strong>
          <nav class="page-links">
            <RouterLink data-testid="loc-str-go-page-a" to="/page-a">Page A</RouterLink>
            <RouterLink data-testid="loc-str-go-page-b" to="/page-b">Page B</RouterLink>
          </nav>
          <RouterView />
        </section>
      </MultiRouterContext>

      <MultiRouterContext
        type="panel"
        name="loc-obj"
        :activator="false"
        :location="objLocation"
        @update:location="(v) => (objEmitted = v)"
      >
        <section class="panel" data-testid="loc-obj-panel">
          <strong>Object location (named route)</strong>
          <nav class="page-links">
            <RouterLink data-testid="loc-obj-go-page-a" to="/page-a">Page A</RouterLink>
            <RouterLink data-testid="loc-obj-go-page-b" to="/page-b">Page B</RouterLink>
          </nav>
          <RouterView />
        </section>
      </MultiRouterContext>
    </div>
  </main>
</template>
