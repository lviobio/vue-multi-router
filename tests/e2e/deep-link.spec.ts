import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const BASE = 'http://localhost:5176/e2e'

test.describe('deep-linking into a fresh session', () => {
  test('a panel-only route URL redirects the main context home', async ({ page }) => {
    await page.goto(`${BASE}/query-page?id=direct`)

    // /query-page is panel content (meta.multiRouterRoot): without stored state
    // the library treats the URL as a fresh start for main, and the app's
    // PanelRouteGuard redirects home instead of rendering the panel fullscreen
    await expect(page).toHaveURL(`${BASE}/context-switching`)
    await expect(page.getByTestId('panel-a')).toBeVisible()
    await expect(page.getByTestId('main-input')).toHaveCount(0)
  })

  test('a regular fixture route deep-links normally', async ({ page }) => {
    await page.goto(`${BASE}/url-sync`)

    await expect(page).toHaveURL(`${BASE}/url-sync`)
    await expect(page.getByTestId('sync-a-panel')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('main')
  })
})
