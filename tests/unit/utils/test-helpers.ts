import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router, RouterHistory } from 'vue-router'
import { MultiRouterManagerInstance } from '../../../src/contextManager'

const TEST_ROUTES = [
  { path: '/', component: { template: '<div>Home</div>' } },
  { path: '/page-a', component: { template: '<div>Page A</div>' } },
  { path: '/page-b', component: { template: '<div>Page B</div>' } },
]

export function createTestHistory(initialLocation = '/'): RouterHistory {
  const history = createMemoryHistory()
  history.replace(initialLocation)
  return history
}

export function createTestRouter(history: RouterHistory): Router {
  return createRouter({ history, routes: TEST_ROUTES })
}

export function createTestManager(
  options: { historyLocation?: string } = {},
): { manager: MultiRouterManagerInstance; history: RouterHistory } {
  const history = createTestHistory(options.historyLocation)

  const makeRouter = (_contextKey: string, ctxHistory: RouterHistory) =>
    createTestRouter(ctxHistory)

  const manager = new MultiRouterManagerInstance(null as any, { history }, makeRouter)

  return { manager, history }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 1000, interval = 50 } = options
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout exceeded')
    }
    await delay(interval)
  }
}
