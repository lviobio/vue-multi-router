import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
// The playground boots with the promise-based IndexedDBStorageAdapter when the
// `e2e-storage-adapter` flag is set (see router.ts), exercising the async
// restore path: contexts render only after their state arrives from storage.
const BASE = 'http://localhost:5176/e2e'

test.describe('async storage adapter (IndexedDB)', () => {
  // Each Playwright test runs in a fresh browser context, so IndexedDB
  // always starts empty — no cleanup needed
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('e2e-storage-adapter', 'indexeddb'))
  })

  test('contexts register and navigate through the async adapter', async ({ page }) => {
    await page.goto(`${BASE}/dynamic-panels`)

    await expect(page.getByTestId('panel-1')).toBeVisible()
    await page.getByTestId('add-panel').click()
    await expect(page.getByTestId('panel-2')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')

    await page.getByTestId('panel-1-input').fill('one')
    await expect(page.getByTestId('panel-1-fullpath')).toHaveText('/query-page?value=one')
  })

  test('panels and their state are restored from IndexedDB after a reload', async ({ page }) => {
    await page.goto(`${BASE}/dynamic-panels`)

    await page.getByTestId('add-panel').click()
    await page.getByTestId('panel-1-input').fill('one')
    await page.getByTestId('panel-2-input').fill('two')
    await expect(page.getByTestId('panel-2-fullpath')).toHaveText('/query-page?value=two')

    await page.reload()

    await expect(page.getByTestId('panel-1')).toBeVisible()
    await expect(page.getByTestId('panel-2')).toBeVisible()
    await expect(page.getByTestId('panel-1-input')).toHaveValue('one')
    await expect(page.getByTestId('panel-2-input')).toHaveValue('two')
  })

  test('browser back/forward works through the async adapter', async ({ page }) => {
    await page.goto(`${BASE}/dynamic-panels`)

    await page.getByTestId('add-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')

    await page.getByTestId('panel-1-input').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-1')
    await page.getByTestId('panel-1-input').pressSequentially('q')

    await page.getByTestId('panel-2-input').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')
    await page.getByTestId('panel-2-input').pressSequentially('a')

    await page.goBack()
    await expect(page.getByTestId('panel-2-input')).toHaveValue('')
    await page.goBack()
    await expect(page.getByTestId('panel-1-input')).toHaveValue('')

    await page.goForward()
    await page.goForward()
    await expect(page.getByTestId('panel-1-input')).toHaveValue('q')
    await expect(page.getByTestId('panel-2-input')).toHaveValue('a')
  })
})
