import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/url-sync'
const BASE = 'http://localhost:5176/e2e'

test.describe('browser URL synchronization', () => {
  test('activating a context syncs its location to the browser URL', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('active-history-context')).toHaveText('main')
    await expect(page).toHaveURL(`${BASE}/url-sync`)

    await page.getByTestId('sync-a-panel').click()

    await expect(page.getByTestId('active-context')).toHaveText('sync-a')
    await expect(page.getByTestId('active-history-context')).toHaveText('sync-a')
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)

    await page.getByTestId('sync-b-panel').click()

    await expect(page.getByTestId('active-history-context')).toHaveText('sync-b')
    await expect(page).toHaveURL(`${BASE}/query-page?id=b`)
  })

  test('in-context navigation updates the URL of the active context only', async ({ page }) => {
    await page.goto(PAGE)

    // Activate the panel (fill() only focuses, it does not trigger mousedown)
    await page.getByTestId('sync-a-input').click()
    await expect(page.getByTestId('active-context')).toHaveText('sync-a')

    await page.getByTestId('sync-a-input').fill('hello')

    await expect(page).toHaveURL(`${BASE}/query-page?id=a&value=hello`)
    await expect(page.getByTestId('sync-a-fullpath')).toHaveText('/query-page?id=a&value=hello')

    // The other context keeps its own independent location
    await expect(page.getByTestId('sync-b-fullpath')).toHaveText('/query-page?id=b')
  })

  test('context with history-enabled=false never touches the browser URL', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('sync-a-panel').click()
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)

    await page.getByTestId('no-history-panel').click()

    // It becomes the active context, but not the active history context
    await expect(page.getByTestId('active-context')).toHaveText('no-history')
    await expect(page.getByTestId('active-history-context')).toHaveText('sync-a')
    await expect(page.getByTestId('no-history-history-enabled')).toHaveText('false')
    await expect(page.getByTestId('no-history-is-history-active')).toHaveText('false')
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)

    // Navigating inside it updates its own router but not the browser URL
    await page.getByTestId('no-history-input').fill('hidden')

    await expect(page.getByTestId('no-history-fullpath')).toHaveText(
      '/query-page?id=no-history&value=hidden',
    )
    await expect(page).toHaveURL(`${BASE}/query-page?id=a`)
  })
})
