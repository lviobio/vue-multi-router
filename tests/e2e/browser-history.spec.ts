import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/url-sync'
const BASE = 'http://localhost:5176/e2e'

test.describe('browser back/forward', () => {
  test('back/forward steps through in-context navigation', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('sync-a-panel').click()
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)

    await page.getByTestId('sync-a-go-page-b').click()

    await expect(page).toHaveURL(`${BASE}/page-b`)
    await expect(page.getByTestId('sync-a-panel').getByTestId('page-b-content')).toBeVisible()

    await page.goBack()

    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)
    await expect(page.getByTestId('sync-a-input')).toBeVisible()

    await page.goForward()

    await expect(page).toHaveURL(`${BASE}/page-b`)
    await expect(page.getByTestId('sync-a-panel').getByTestId('page-b-content')).toBeVisible()
  })

  test('back/forward re-activates the context that owns the history entry', async ({ page }) => {
    await page.goto(PAGE)

    // Build history inside sync-a: query-page -> page-b
    await page.getByTestId('sync-a-panel').click()
    await page.getByTestId('sync-a-go-page-b').click()
    await expect(page).toHaveURL(`${BASE}/page-b`)

    await page.goBack()
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)

    // Switch to another context (replaces the current entry)
    await page.getByTestId('sync-b-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('sync-b')
    await expect(page).toHaveURL(`${BASE}/query-page?id=b`)

    // Forward goes to the entry owned by sync-a and re-activates it
    await page.goForward()

    await expect(page).toHaveURL(`${BASE}/page-b`)
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')
    await expect(page.getByTestId('sync-a-panel').getByTestId('page-b-content')).toBeVisible()
  })
})
