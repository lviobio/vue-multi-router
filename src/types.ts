export type Wip = true

export interface ContextTypeOptions {
  canUseAsHistoryContext: boolean
  single: boolean
}

export type ContextTypes = Record<string, ContextTypeOptions>
