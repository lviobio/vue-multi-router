import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/context-switching'

test.describe('context switching', () => {
  test('renders both panels on load', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('panel-a')).toBeVisible()
    await expect(page.getByTestId('panel-b')).toBeVisible()
  })

  test('clicking "Activate Panel A" sets panel-a as the active context', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('activate-panel-a').click()

    await expect(page.getByTestId('active-context')).toHaveText('panel-a')
  })

  test('clicking "Activate Panel B" sets panel-b as the active context', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('activate-panel-a').click()
    await page.getByTestId('activate-panel-b').click()

    await expect(page.getByTestId('active-context')).toHaveText('panel-b')
  })

  test('switching back to panel-a restores it as the active context', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('activate-panel-b').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-b')

    await page.getByTestId('activate-panel-a').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-a')
  })

  test('each panel renders its own route content independently', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('page-a-content')).toBeVisible()
    await expect(page.getByTestId('page-b-content')).toBeVisible()
  })
})
