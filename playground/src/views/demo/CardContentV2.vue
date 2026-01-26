<script setup lang="ts">
import { NCard, NInput, NSpace, NText } from 'naive-ui'
import { reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onMultiRouterContextActivate, useMultiRouterContext } from '../../../../src'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  title?: string
}>()

const emit = defineEmits(['remove'])

const inputRef = useTemplateRef('inputRef')

const { isActive, historyEnabled } = useMultiRouterContext()

const values = reactive({
  value: '',
  number: 0 as number | null,
})

onMultiRouterContextActivate(async () => {
  setTimeout(() => {
    inputRef.value?.focus()
  })
})

watch(values, () => {
  router.push({
    ...route,
    query: {
      value: values.value ? values.value : '',
      number: values.number !== null ? values.number : undefined,
    },
  })
})

watch(
  () => ({ ...route.query }),
  (query) => {
    values.value = query.value as string
    values.number = query.number ? Number(query.number) : null
  },
  { immediate: true },
)

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const someAnimals = ['cat', 'dog', 'owl', 'cow', 'bat', 'rat', 'hen', 'pig', 'fox', 'goose']

const canTypeSomething = ref(true)
async function handleTypeSomething() {
  canTypeSomething.value = false
  await wait(500)
  values.value = ''
  for (let i = 0; i < someAnimals.length; i++) {
    const animal = someAnimals[i]
    values.value += (i < someAnimals.length && i !== 0 ? ' ' : '') + animal
    await wait(500)
  }
  canTypeSomething.value = true
}
</script>

<template>
  <NCard
    header-class="py-1!"
    :theme-overrides="{
      borderColor: isActive ? 'var(--color-green-600)' : undefined,
    }"
    size="small"
    style="min-height: 130px"
    :segmented="{ content: true }"
    closable
    @close="emit('remove')"
  >
    <template #header>
      <NText>
        {{ props.title || 'Card' }}
      </NText>
      <NPopover trigger="hover">
        <template #trigger>
          <NBadge :offset="[12, -8]" :type="historyEnabled ? 'success' : 'error'">
            <template #value>
              <span>H</span>
            </template>
          </NBadge>
        </template>
        <NText v-if="historyEnabled">
          <p>History is syncing with browser url when active</p>
          <p>Try to create a new card without history checked</p>
        </NText>
        <NText v-else>History is not syncing with browser url</NText>
      </NPopover>
    </template>
    <NSpace size="small" vertical :wrap="false">
      <p>This is version 2 of the card component! It has a different url.</p>
      <NFormItem label="Value" :show-feedback="false">
        <NInput v-model:value="values.value" placeholder="Type something..." ref="inputRef" />
      </NFormItem>
      <div class="flex flex-col">
        <NText depth="3" class="text-xs">
          <code>{{ values }}</code>
        </NText>
      </div>
    </NSpace>
    <template #footer>
      <NSpace>
        <NButton size="tiny" @click="handleTypeSomething" :disabled="!canTypeSomething">
          Type something
        </NButton>
        <NButton size="tiny" @click="router.push({ name: 'demo.cards.wrapper.content' })">
          Navigate to previous version
        </NButton>
      </NSpace>
    </template>
  </NCard>
</template>
