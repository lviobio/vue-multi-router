<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { NButton, NH1, NTabPane, NTabs, NText } from 'naive-ui'
import { MultiRouterContext, useMultiRouter } from '../../../../src'

const { setActive, hasContext, activeContextKey } = useMultiRouter()

interface ITab {
  name: string
  position: number
}

const initialValueBuilder = (): ITab[] => [{ name: 'Tab 1', position: 1 }]

const tabs = useSessionStorage<ITab[]>('demo-tabs', initialValueBuilder())
const activeTabName = useSessionStorage<string>(
  'demo-tabs-active',
  `tab-${tabs.value[0]?.position}`,
)

const tabCounter = computed(() =>
  tabs.value.length > 0 ? Math.max(...tabs.value.map((t) => t.position)) : 0,
)

// Sync activeContextKey -> activeTabName (when context changes externally)
watch(
  activeContextKey,
  (key) => {
    if (key?.startsWith('tab-') && tabs.value.some((t) => `tab-${t.position}` === key)) {
      activeTabName.value = key
    }
  },
  { immediate: true },
)

// When tab changes in UI, activate the context (after it's mounted)
async function onTabChange(tabName: string) {
  activeTabName.value = tabName
  await nextTick()
  if (hasContext(tabName)) {
    setActive(tabName)
  }
}

async function addTab() {
  const newPosition = tabCounter.value + 1
  const contextName = `tab-${newPosition}`
  tabs.value.push({
    name: `Tab ${newPosition}`,
    position: newPosition,
  })
  activeTabName.value = contextName
  await nextTick()
  if (hasContext(contextName)) {
    setActive(contextName)
  }
}

function removeTab(position: number) {
  const index = tabs.value.findIndex((t) => t.position === position)
  if (index > -1) {
    tabs.value.splice(index, 1)
  }
}

async function reset() {
  tabs.value = []
  await nextTick()
  tabs.value = initialValueBuilder()
  activeTabName.value = `tab-${tabs.value[0]?.position}`
}
</script>

<template>
  <div>
    <NH1>
      <div class="flex gap-4 items-center">
        <span>Tabs Demo</span>
        <NButton class="mt-1!" tertiary size="tiny" @click="reset" v-if="tabs.length > 1">
          Reset
        </NButton>
      </div>
    </NH1>

    <NText depth="2">
      Each tab has its own independent router context. Switch between tabs and navigate - each tab
      maintains its own history.
    </NText>
    <p>
      <NText depth="2">You can also try reloading the page after creating multiple tabs.</NText>
    </p>
    <p>
      <NText depth="3">All data is stored in session storage.</NText>
    </p>

    <NTabs
      :value="activeTabName"
      animated
      type="card"
      closable
      addable
      tab-style="min-width: 80px;"
      class="mt-6"
      @update:value="onTabChange"
      @close="(name: string) => removeTab(Number(name.replace('tab-', '')))"
      @add="addTab"
    >
      <NTabPane
        v-for="tab in tabs"
        :key="tab.position"
        :name="`tab-${tab.position}`"
        display-directive="show:lazy"
        :tab="tab.name"
      >
        <MultiRouterContext
          type="tab"
          :name="`tab-${tab.position}`"
          initial-location="/demo/tabs/content"
        >
          <RouterView :title="tab.name" />
        </MultiRouterContext>
      </NTabPane>
    </NTabs>
  </div>
</template>
