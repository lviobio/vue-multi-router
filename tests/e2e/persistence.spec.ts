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
})
