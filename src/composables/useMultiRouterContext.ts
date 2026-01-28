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

  const activate = (updateHistory = true) => {
    setActive(contextKey, updateHistory)
  }

  return {
    manager,
    contextKey,
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
