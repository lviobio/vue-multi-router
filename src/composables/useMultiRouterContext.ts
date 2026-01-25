import { computed, inject } from 'vue'
import { multiRouterContextKey } from '@/injectionSymbols'
import type { Router } from 'vue-router'
import { useMultiRouter } from './useMultiRouter'

export function useMultiRouterContext() {
  const { manager, activeContextKey, activeHistoryContextKey, setActive, hasContext } =
    useMultiRouter()

  const contextKey = inject(multiRouterContextKey)

  if (!contextKey) {
    throw new Error('[useMultiRouterContext] Must be used within MultiRouterContext')
  }

  const router = computed<Router>(() => manager.getRouter(contextKey))

  const route = computed(() => router.value.currentRoute.value)

  const isActive = computed(() => activeContextKey.value === contextKey)

  const isHistoryActive = computed(() => activeHistoryContextKey.value === contextKey)

  const historyEnabled = computed(() => manager.getContextHistoryEnabled(contextKey))

  const activate = (updateHistory = true) => {
    setActive(contextKey, updateHistory)
  }

  return {
    manager,
    contextKey,
    router,
    route,
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
