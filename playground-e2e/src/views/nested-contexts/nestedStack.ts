import { ref } from 'vue'

// Persisted stack of nested-panel ids on top of the base panel (id 0), so the
// nesting can be rebuilt after a reload. chain[d] is the child opened by the
// panel at depth d. Mirrors how a real app would persist which nested contexts
// to re-render; the library handles activation/fallback/restore of them.
const KEY = 'e2e-nested-chain'

function load(): number[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

const chain = ref<number[]>(load())

function persist() {
  sessionStorage.setItem(KEY, JSON.stringify(chain.value))
}

export function useNestedStack() {
  const childOf = (depth: number) => chain.value[depth] ?? null

  function openChild(depth: number, id: number) {
    chain.value = [...chain.value.slice(0, depth), id]
    persist()
  }

  // Close the panel at `panelDepth` (and anything deeper). Its own chain entry
  // is at index panelDepth - 1; the base panel (depth 0) isn't in the chain.
  function closeSelf(panelDepth: number) {
    if (panelDepth > 0) {
      chain.value = chain.value.slice(0, panelDepth - 1)
      persist()
    }
  }

  function reset() {
    chain.value = []
    persist()
  }

  return { chain, childOf, openChild, closeSelf, reset }
}
