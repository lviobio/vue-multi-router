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
