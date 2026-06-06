import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const BASE = 'http://localhost:5176/e2e'

test.describe('session persistence across reloads', () => {
  test('in-context navigation survives a reload (storage wins over initial-location)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/basic-navigation`)

    await page.getByTestId('go-page-b').click()
    await expect(page.getByTestId('page-b-content')).toBeVisible()

    await page.reload()

    // Restored from sessionStorage, not reset to initial-location (/page-a)
    await expect(page.getByTestId('page-b-content')).toBeVisible()
    await expect(page.getByTestId('page-a-content')).not.toBeVisible()
  })

  test('every context restores its own state and the last active context is re-activated', async ({
    page,
  }) => {
    await page.goto(`${BASE}/url-sync`)

    // Activate sync-a, then push a query change into its router
    await page.getByTestId('sync-a-input').click()
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')

    await page.getByTestId('sync-a-input').fill('persisted')
    await expect(page).toHaveURL(`${BASE}/query-page?id=a&value=persisted`)

    await page.reload()

    // Last active context is restored
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')
    await expect(page).toHaveURL(`${BASE}/query-page?id=a&value=persisted`)

    // Each context restored its own virtual history stack
    await expect(page.getByTestId('sync-a-input')).toHaveValue('persisted')
    await expect(page.getByTestId('sync-b-fullpath')).toHaveText('/query-page?id=b')
  })

  test('reload with a stale saved active context falls back gracefully', async ({ page }) => {
    await page.goto(`${BASE}/dynamic-panels`)

    await page.getByTestId('add-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')

    // Make the saved active context stale: drop panel-2 from the fixture's own
    // panel list while the library storage still points at it as last active
    await page.evaluate(() => {
      sessionStorage.setItem('e2e-dynamic-panels', JSON.stringify([1]))
    })

    await page.reload()

    // The saved context never registers — the default context takes over, no crash
    await expect(page.getByTestId('panel-1')).toBeVisible()
    await expect(page.getByTestId('panel-2')).toHaveCount(0)
    await expect(page.getByTestId('active-context')).toHaveText('main')

    // The app stays fully functional
    await page.getByTestId('panel-1').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-1')
  })

  test('reload after clearing sessionStorage while a panel owns the URL redirects home', async ({
    page,
  }) => {
    await page.goto(`${BASE}/dynamic-panels`)

    await page.getByTestId('add-panel').click()
    await page.getByTestId('panel-2-input').fill('asd')
    await expect(page).toHaveURL(`${BASE}/query-page?value=asd`)

    await page.evaluate(() => sessionStorage.clear())
    await page.reload()

    // No stored state: the panel URL looks like a fresh start for main —
    // the PanelRouteGuard sends it home instead of rendering the dead
    // panel's content fullscreen
    await expect(page).toHaveURL(`${BASE}/context-switching`)
    await expect(page.getByTestId('main-input')).toHaveCount(0)
    await expect(page.getByTestId('panel-a')).toBeVisible()
  })
})
