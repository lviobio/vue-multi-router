<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { NButton, NCard, NH1, NIcon, NText } from 'naive-ui'
import { Add as AddIcon } from '@vicons/ionicons5'
import { MultiRouterContext, MultiRouterContextActivator, useMultiRouter } from '../../../../src'

const { setActive, hasContext } = useMultiRouter()

interface ICard {
  name: string
  position: number
  history: boolean
}

const initialValueBuilder = (): ICard[] => [{ name: 'Card 1', position: 1, history: true }]

const cards = useSessionStorage<ICard[]>('demo-cards', initialValueBuilder())

const cardCounter = computed(() =>
  cards.value.length > 0 ? Math.max(...cards.value.map((c) => c.position)) : 0,
)

const newCardOptions = useSessionStorage('demo-cards-new-options', {
  history: true,
})

async function addCard() {
  const newPosition = cardCounter.value + 1
  const contextName = `card-${newPosition}`
  cards.value.push({
    name: `Card ${newPosition}`,
    position: newPosition,
    history: newCardOptions.value.history,
  })
  // Wait for the component to mount and register the context
  await nextTick()
  // Activate the new card
  if (hasContext(contextName)) {
    setActive(contextName)
  }
}

function removeCard(position: number) {
  const index = cards.value.findIndex((c) => c.position === position)
  if (index > -1) {
    cards.value.splice(index, 1)
  }
}

async function reset() {
  cards.value = []
  //Wait for cards to unload & remove their state from storage
  await nextTick()
  cards.value = initialValueBuilder()
}
</script>

<template>
  <div>
    <NH1>
      <div class="flex gap-4 items-center">
        <span>Cards Demo</span>
        <NButton class="mt-1!" tertiary size="tiny" @click="reset" v-if="cards.length > 1"
          >Reset</NButton
        >
      </div>
    </NH1>

    <NText depth="2">
      Each card has its own independent router context. Type in the input to see the query params
      update independently.
    </NText>
    <p>
      <NText depth="2"> You can also try reloading the page after creating multiple cards. </NText>
    </p>
    <p>
      <NText depth="3">All data is stored in session storage.</NText>
    </p>

    <NGrid class="mt-6" x-gap="16" y-gap="16" cols="1 s:2 m:3 l:4 xl:5 xxl:6" responsive="screen">
      <NGi v-for="card in cards" :key="card.position">
        <MultiRouterContext
          type="card"
          :name="`card-${card.position}`"
          initial-location="/demo/cards/wrapper/content"
          :history-enabled="card.history"
        >
          <MultiRouterContextActivator prevent-class="n-card-header__close">
            <RouterView :title="card.name" @remove="removeCard(card.position)" />
          </MultiRouterContextActivator>
        </MultiRouterContext>
      </NGi>

      <NGi>
        <NCard :bordered="true" hoverable>
          <NSpace align="center">
            <NButton :focusable="false" @click="addCard">
              New card
              <template #icon>
                <NIcon size="22"><AddIcon /></NIcon>
              </template>
            </NButton>
            <NCheckbox v-model:checked="newCardOptions.history">History</NCheckbox>
          </NSpace>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>
