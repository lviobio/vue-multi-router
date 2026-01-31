<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { MultiRouterContext, useMultiRouter } from '../../../../src'
import BrowserFrame from './BrowserFrame.vue'
import DemoCard from './DemoCard.vue'

const { setActive, hasContext } = useMultiRouter()

interface Card {
  id: number
  name: string
}

const cards = ref<Card[]>([
  { id: 1, name: 'Card 1' },
  { id: 2, name: 'Card 2' },
])

const counter = computed(() =>
  cards.value.length > 0 ? Math.max(...cards.value.map((c) => c.id)) : 0,
)

async function addCard() {
  const newId = counter.value + 1
  const contextName = `card-${newId}`
  cards.value.push({
    id: newId,
    name: `Card ${newId}`,
  })
  await nextTick()
  if (hasContext(contextName)) {
    setActive(contextName)
  }
}

function removeCard(id: number) {
  if (cards.value.length <= 1) return // Keep at least one card
  const index = cards.value.findIndex((c) => c.id === id)
  if (index > -1) {
    cards.value.splice(index, 1)
  }
}
</script>

<template>
  <MultiRouterContext type="main" name="main" default>
    <BrowserFrame>
      <div class="cards-grid">
        <MultiRouterContext
          v-for="card in cards"
          :key="card.id"
          type="card"
          :name="`card-${card.id}`"
          initial-location="/"
        >
          <DemoCard :title="card.name" :closable="cards.length > 1" @close="removeCard(card.id)" />
        </MultiRouterContext>

        <button class="add-card-btn" @click="addCard">+ Add Card</button>
      </div>
    </BrowserFrame>
  </MultiRouterContext>
</template>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  padding: 16px;
}

.add-card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 2px dashed var(--vp-c-divider);
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-card-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
</style>
