<script setup lang="ts">
import { NButton, NCard, NInput, NInputNumber, NSpace, NText } from 'naive-ui'
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  onMultiRouterContextActivate,
  useMultiRouter,
  useMultiRouterContext,
} from '../../../../src'
import { surfaceMetas } from '../../composables/surface-meta'
import { usePanels } from '../../composables/usePanels'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  title?: string
  closable?: boolean
}>()

const emit = defineEmits(['close'])

const inputRef = useTemplateRef('inputRef')

const { isActive, historyEnabled, contextKey } = useMultiRouterContext()
const { manager } = useMultiRouter()
const panels = usePanels()

const values = reactive({
  value: '',
  number: 0 as number | null,
})

// Read by the panel host (PanelView) when this card is opened as a modal window,
// so the window header reflects the card — live as you type.
defineExpose({ title: computed(() => values.value || props.title || 'Card') })

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

const someLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o']

const canTypeSomething = ref(true)
async function handleTypeSomething() {
  canTypeSomething.value = false
  await wait(500)
  values.value = ''
  for (const letter of someLetters) {
    values.value += letter
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
    :closable="props.closable"
    @close="emit('close')"
  >
    <template #header>
      <div class="flex justify-between">
        <div>
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
        </div>
        <div v-if="!panels.byContextKey(contextKey)" class="flex gap-1">
          <NButton
            v-for="s in surfaceMetas"
            :key="s.id"
            size="tiny"
            tertiary
            @click="panels.open(route.fullPath, s.id, manager)"
            :title="s.label"
          >
            <NIcon :size="20"><component :is="s.icon" /></NIcon>
          </NButton>
        </div>
      </div>
    </template>
    <NSpace size="small">
      <NSpace :wrap="false">
        <NFormItem label="Value" :show-feedback="false">
          <NInput v-model:value="values.value" placeholder="Type something..." ref="inputRef" />
        </NFormItem>
        <NFormItem label="Number" :show-feedback="false">
          <NInputNumber v-model:value="values.number" placeholder="Some number" />
        </NFormItem>
      </NSpace>
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
        <NButton size="tiny" @click="router.push({ name: 'demo.cards.wrapper.content-v2' })">
          Navigate to card v2
        </NButton>
      </NSpace>
    </template>
  </NCard>
</template>
