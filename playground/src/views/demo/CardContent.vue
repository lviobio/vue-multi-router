<script setup lang="ts">
import { NInput, NText, NSpace, NButton, NIcon, NCard } from 'naive-ui'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const emit = defineEmits(['remove'])

const props = defineProps<{
  title: string
}>()

const inputValue = ref('')

watch(inputValue, () => {
  router.replace({
    ...route,
    query: inputValue.value ? { value: inputValue.value } : {},
  })
})

watch(
  () => route.query.value,
  (value) => {
    inputValue.value = value as string
  },
  { immediate: true },
)
</script>

<template>
  <NCard
    :title="props.title"
    header-class="py-1!"
    size="small"
    style="min-height: 130px"
    :segmented="{ content: true }"
  >
    <template #header-extra>
      <NButton text type="error" @click="emit('remove')">
        <template #icon>
          <NIcon><CloseIcon /></NIcon>
        </template>
      </NButton>
    </template>

    <NSpace vertical>
      <NInput v-model:value="inputValue" placeholder="Type something..." />
      <NText depth="3" style="font-family: monospace; font-size: 12px; word-break: break-all">
        query: {{ route.query }}
      </NText>
    </NSpace>
  </NCard>
</template>
