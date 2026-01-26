// Core function
export { createMultiRouter } from './multi-router'

// Utils
export { onMultiRouterContextActivate } from './hooks'

// Components
export { default as MultiRouterContext } from './components/MultiRouterContext.vue'
export { default as MultiRouterContextActivator } from './components/MultiRouterContextActivator.vue'

// Composables
export { useMultiRouter } from './composables/useMultiRouter'
export { useMultiRouterContext } from './composables/useMultiRouterContext'

// History types and utilities
export type {
  MultiRouterHistoryManagerOptions,
  ContextSwitchMode,
  HistoryBuilder,
  HistoryLocation,
  HistoryState,
  NavigationCallback,
  NavigationInformation,
  VirtualStack,
} from './history'

// Injection symbols (for advanced usage)
export { multiRouterContextManagerKey, multiRouterContextKey } from './injectionSymbols'
