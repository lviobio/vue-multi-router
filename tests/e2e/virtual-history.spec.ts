import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const BASE = 'http://localhost:5176/e2e'

test.describe('virtual stack navigation (router.back/forward without browser history)', () => {
  test('back/forward in a history-disabled context use the virtual stack', async ({ page }) => {
    await page.goto(`${BASE}/url-sync`)

    const panel = page.getByTestId('no-history-panel')

    await panel.click()
    await expect(page.getByTestId('active-context')).toHaveText('no-history')

    await page.getByTestId('no-history-go-page-b').click()
    await expect(panel.getByTestId('page-b-content')).toBeVisible()
    await expect(page).toHaveURL(`${BASE}/url-sync`)

    await page.getByTestId('no-history-back').click()

    await expect(page.getByTestId('no-history-fullpath')).toHaveText('/query-page?id=no-history')
    await expect(panel.getByTestId('page-b-content')).not.toBeVisible()
    await expect(page).toHaveURL(`${BASE}/url-sync`)

    await page.getByTestId('no-history-forward').click()

    await expect(panel.getByTestId('page-b-content')).toBeVisible()
    await expect(page).toHaveURL(`${BASE}/url-sync`)
  })

  test('back/forward in a context that does not own the browser history leave the URL alone', async ({
    page,
  }) => {
    await page.goto(`${BASE}/basic-navigation`)

    // panel-nav is never activated, so `main` keeps owning the browser URL
    await page.getByTestId('go-page-b').click()
    await expect(page.getByTestId('page-b-content')).toBeVisible()
    await expect(page).toHaveURL(`${BASE}/basic-navigation`)

    await page.getByTestId('panel-nav-back').click()

    await expect(page.getByTestId('page-a-content')).toBeVisible()
    await expect(page).toHaveURL(`${BASE}/basic-navigation`)

    await page.getByTestId('panel-nav-forward').click()

    await expect(page.getByTestId('page-b-content')).toBeVisible()
    await expect(page).toHaveURL(`${BASE}/basic-navigation`)
  })
})
