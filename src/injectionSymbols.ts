import type { InjectionKey } from 'vue'
import type { MultiRouterManagerInstance } from '@/contextManager'
import { multiRouterContext, multiRouterContextManager } from '@/symbols'

export const multiRouterContextManagerKey: InjectionKey<MultiRouterManagerInstance> =
  multiRouterContextManager

export const multiRouterContextKey: InjectionKey<string> = multiRouterContext
