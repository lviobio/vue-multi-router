<script setup lang="ts">
import { NCard, NInput, NInputNumber, NSpace, NText } from 'naive-ui'
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMultiRouterContext } from '../../../../src'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  title?: string
}>()

const emit = defineEmits(['remove'])

const { isActive } = useMultiRouterContext()

const values = reactive({
  value: '',
  number: 0 as number | null,
})

watch(values, () => {
  router.replace({
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
      <div>
        {{ props.title || 'Card' }}
      </div>
    </template>
    <NSpace size="small">
      <NSpace :wrap="false">
        <NFormItem label="Value" :show-feedback="false">
          <NInput v-model:value="values.value" placeholder="Type something..." />
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
  </NCard>
</template>
