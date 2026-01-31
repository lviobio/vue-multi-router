import { computed, inject } from 'vue'
import { multiRouterContextManagerKey } from '@/injectionSymbols'

/**
 * Composable for accessing the multi-router manager outside a context.
 * Use this when you need to control contexts from a parent component.
 *
 * For usage inside a context, use `useMultiRouterContext()` instead.
 */
export function useMultiRouter() {
  const manager = inject(multiRouterContextManagerKey)

  if (!manager) {
    throw new Error('[useMultiRouter] Must be used within MultiRouterContextProvider')
  }

  const activeContextKey = computed(() => manager.getActiveContextRef().value?.key)

  const activeContext = computed(() => manager.getActiveContextRef().value)

  const activeHistoryContextKey = computed(() => manager.getActiveHistoryContextRef().value?.key)

  const setActive = (contextKey: string, updateHistory = true) => {
    manager.setActive(contextKey, updateHistory)
  }

  const hasContext = (contextKey: string) => {
    return manager.has(contextKey)
  }

  return {
    manager,
    activeContext,
    activeContextKey,
    activeHistoryContextKey,
    setActive,
    hasContext,
  }
}
