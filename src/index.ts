// Core function
export { createMultiRouter } from './multi-router'

// Context templates
export {
  contextTemplateWindows,
  contextTemplateTabs,
  contextTemplateMainWithWindows,
  contextTemplateDesktopWithWindows,
  contextTemplateTabsWithWindows,
} from './multi-router'

// Components
export { default as MultiRouterContext } from './components/MultiRouterContext.vue'
export { default as MultiRouterContextActivator } from './components/MultiRouterContextActivator.vue'

// Composables
export { useMultiRouterContext } from './composables/useMultiRouterContext'

// Types
export * from './types'

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
