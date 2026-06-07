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
  HistoryLocation,
  HistoryState,
  NavigationCallback,
  NavigationInformation,
  VirtualStack,
} from './history'

// Storage adapters — pass via `historyOptions.storageAdapter`.
// Implement a custom backend by extending KeyValueStorageAdapter (3 methods,
// sync or promise-based) or implementing ContextStorageAdapter directly.
export type {
  ContextStorageAdapter,
  StoredVirtualStack,
  MaybePromise,
  IndexedDBStorageAdapterOptions,
} from './history'
export { KeyValueStorageAdapter, SessionStorageAdapter, IndexedDBStorageAdapter } from './history'

// Activation strategies
export type {
  ActivationStrategy,
  ActivationStrategyFactory,
  ActivationStrategyContext,
} from './activation-strategies'
export {
  ImmediateActivationStrategy,
  StabilizationActivationStrategy,
  immediateActivation,
  stabilizationActivation,
} from './activation-strategies'

// Injection symbols (for advanced usage)
export { multiRouterContextManagerKey, multiRouterContextKey } from './injectionSymbols'
