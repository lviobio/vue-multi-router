import { computed, inject } from 'vue'
import { multiRouterContextKey } from '@/injectionSymbols'
import { useMultiRouter } from './useMultiRouter'

export function useMultiRouterContext() {
  const { manager, activeContextKey, activeHistoryContextKey, setActive, hasContext } =
    useMultiRouter()

  const contextKey = inject(multiRouterContextKey)

  if (!contextKey) {
    throw new Error('[useMultiRouterContext] Must be used within MultiRouterContext')
  }

  const isActive = computed(() => activeContextKey.value === contextKey)

  const isHistoryActive = computed(() => activeHistoryContextKey.value === contextKey)

  const historyEnabled = computed(() => manager.getContextHistoryEnabled(contextKey))

  // Nesting info (set when the context registers, so stable for its lifetime):
  // the enclosing context key and how deep this context is nested (0 = top).
  const parentKey = manager.getParent(contextKey)
  let depth = 0
  for (let ancestor = parentKey; ancestor; ancestor = manager.getParent(ancestor)) {
    depth++
  }

  const activate = (updateHistory = true) => {
    setActive(contextKey, updateHistory)
  }

  return {
    manager,
    contextKey,
    parentKey,
    depth,
    isActive,
    isHistoryActive,
    activeContextKey,
    activeHistoryContextKey,
    historyEnabled,
    activate,
    setActive,
    hasContext,
  }
}
