<script setup lang="ts">
import { NLayout, NLayoutHeader, NLayoutContent, NMenu, type MenuProps } from 'naive-ui'
import { h } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const subMenuOptions = [
  {
    label: () => h(RouterLink, { to: '/demo/cards' }, { default: () => 'Cards' }),
    key: 'cards',
  },
  {
    label: () => h(RouterLink, { to: '/demo/tabs' }, { default: () => 'Tabs' }),
    key: 'tabs',
  },
  {
    label: () => h(RouterLink, { to: '/demo/windows' }, { default: () => 'Windows' }),
    key: 'windows',
  },
]

const subMenuThemeOverrides: NonNullable<MenuProps['themeOverrides']> = {
  itemHeight: '36px',
}
</script>

<template>
  <NLayout>
    <NLayoutHeader bordered class="header main-header">
      <RouterLink to="/" class="title">Vue Multi Router</RouterLink>
      <RouterLink to="/" class="demo-link">Demo</RouterLink>
    </NLayoutHeader>
    <NLayoutHeader bordered class="header sub-header">
      <NMenu
        mode="horizontal"
        :options="subMenuOptions"
        :value="route.name as string"
        :theme-overrides="subMenuThemeOverrides"
      />
    </NLayoutHeader>
    <NLayoutContent content-style="padding: 24px;">
      <RouterView />
    </NLayoutContent>
  </NLayout>
</template>

<style scoped>
.header {
  padding: 0 24px;
  display: flex;
  align-items: center;
}

.main-header {
  height: 40px;
  gap: 24px;
}

.sub-header {
  height: 36px;
}

.title {
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  color: inherit;
}

.demo-link {
  color: var(--n-item-text-color-active, #18a058);
  text-decoration: none;
  font-weight: 500;
}
</style>
