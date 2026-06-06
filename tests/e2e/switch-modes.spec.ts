import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
// The playground reads `e2e-switch-mode` from sessionStorage at startup (see router.ts),
// so each describe block injects the desired contextSwitchMode before the app boots.
const PAGE = 'http://localhost:5176/e2e/url-sync'
const BASE = 'http://localhost:5176/e2e'

test.describe('contextSwitchMode: push', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('e2e-switch-mode', 'push'))
  })

  test('context switches push history entries; back/forward undo the switches', async ({
    page,
  }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('active-context')).toHaveText('main')

    await page.getByTestId('sync-a-panel').click()
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)

    await page.getByTestId('sync-b-panel').click()
    await expect(page).toHaveURL(`${BASE}/query-page?id=b`)

    // Each switch pushed an entry: back returns to sync-a and re-activates it…
    await page.goBack()
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')

    // …and one more back returns to the main context
    await page.goBack()
    await expect(page).toHaveURL(`${BASE}/url-sync`)
    await expect(page.getByTestId('active-context')).toHaveText('main')

    await page.goForward()
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')
  })
})

test.describe('contextSwitchMode: none', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('e2e-switch-mode', 'none'))
  })

  test('context switches never touch the browser URL', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('sync-a-panel').click()

    await expect(page.getByTestId('active-context')).toHaveText('sync-a')
    await expect(page.getByTestId('active-history-context')).toHaveText('sync-a')
    await expect(page).toHaveURL(`${BASE}/url-sync`)

    await page.getByTestId('sync-b-panel').click()

    await expect(page.getByTestId('active-context')).toHaveText('sync-b')
    await expect(page).toHaveURL(`${BASE}/url-sync`)
  })

  test('in-context push still updates the URL of the active history context', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('sync-a-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')
    await expect(page).toHaveURL(`${BASE}/url-sync`)

    // push/replace operations still go to the browser history — only
    // context *switches* skip the URL update in 'none' mode
    await page.getByTestId('sync-a-input').fill('x')

    await expect(page).toHaveURL(`${BASE}/query-page?id=a&value=x`)

    await page.getByTestId('sync-b-panel').click()
    await expect(page).toHaveURL(`${BASE}/query-page?id=a&value=x`)
  })
})
