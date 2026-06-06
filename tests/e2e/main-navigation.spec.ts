import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const BASE = 'http://localhost:5176/e2e'

test.describe('main context navigating away from a fixture', () => {
  test('unregisters the panels, falls back to main and keeps working', async ({ page }) => {
    await page.goto(`${BASE}/url-sync`)

    await page.getByTestId('sync-a-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)

    // Navigate the main context to another fixture: the nav click activates main
    // (built-in activator), then the url-sync panels unmount and unregister
    await page.getByTestId('nav-context-switching').click()

    await expect(page.getByTestId('panel-a')).toBeVisible()
    await expect(page.getByTestId('panel-b')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('main')
    // main owns the browser history again, and the URL syncs to its location
    await expect(page).toHaveURL(`${BASE}/context-switching`)

    // main owns the browser history again: the next navigation updates the URL
    await page.getByTestId('nav-basic-navigation').click()

    await expect(page).toHaveURL(`${BASE}/basic-navigation`)
    await expect(page.getByTestId('page-a-content')).toBeVisible()
  })
})
