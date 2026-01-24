<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NButton, NText, NH1, NIcon } from 'naive-ui'
import { Add as AddIcon } from '@vicons/ionicons5'
import { MultiRouterContext, MultiRouterContextActivator } from '../../../../src'

const cards = ref([{ name: 'Card 1', position: 1 }])

let cardCounter = 1

function addCard() {
  cardCounter++

  cards.value.push({
    name: `Card ${cardCounter}`,
    position: cardCounter,
  })
}

function removeCard(position: number) {
  const index = cards.value.findIndex((c) => c.position === position)
  if (index > -1) {
    cards.value.splice(index, 1)
  }

  cardCounter = cards.value.length > 0 ? cards.value[cards.value.length - 1].position : 0
}
</script>

<template>
  <div>
    <NH1>Cards Demo</NH1>
    <NText depth="3">
      Each card has its own independent router context. Type in the input to see the query params
      update independently.
    </NText>
    <p>
      <NText depth="3"> You can also try reloading the page after creating multiple cards. </NText>
    </p>

    <NGrid class="mt-6" x-gap="16" y-gap="16" cols="1 s:2 m:3 l:4 xl:5 xxl:6" responsive="screen">
      <NGi v-for="card in cards" :key="card.position">
        <MultiRouterContext
          type="card"
          :name="`card-${card.position}`"
          initial-location="/demo/cards/content"
        >
          <MultiRouterContextActivator>
            <RouterView :title="card.name" @remove="removeCard(card.position)" />
          </MultiRouterContextActivator>
        </MultiRouterContext>
      </NGi>

      <NGi>
        <NCard
          style="min-height: 130px"
          content-class="grid place-items-center cursor-pointer"
          :bordered="true"
          hoverable
          @click="addCard"
        >
          <NButton text :focusable="false">
            <template #icon>
              <NIcon size="48"><AddIcon /></NIcon>
            </template>
          </NButton>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>
