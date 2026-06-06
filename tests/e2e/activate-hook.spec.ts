import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/activate-hook'

test.describe('onMultiRouterContextActivate', () => {
  test('fires when the context becomes active', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('0')
    await expect(page.getByTestId('hook-two-activate-count')).toHaveText('0')

    await page.getByTestId('hook-one-panel').click()

    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('1')
    await expect(page.getByTestId('hook-two-activate-count')).toHaveText('0')
  })

  test('does not fire again when the context is already active', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('hook-one-panel').click()
    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('1')

    await page.getByTestId('hook-one-panel').click()

    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('1')
  })

  test('fires once per activation when switching back and forth', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('hook-one-panel').click()
    await page.getByTestId('hook-two-panel').click()

    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('1')
    await expect(page.getByTestId('hook-two-activate-count')).toHaveText('1')

    await page.getByTestId('hook-one-panel').click()

    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('2')
    await expect(page.getByTestId('hook-two-activate-count')).toHaveText('1')
  })

  test('fires immediately on mount when the context is already active', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('hook-one-panel').click()
    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('1')

    // Remount the counter inside the active context: the callback runs immediately
    await page.getByTestId('toggle-counter-one').click()
    await expect(page.getByTestId('hook-one-activate-count')).not.toBeVisible()
    await page.getByTestId('toggle-counter-one').click()

    await expect(page.getByTestId('hook-one-activate-count')).toHaveText('1')

    // Remounting inside an inactive context does not fire the callback
    await page.getByTestId('toggle-counter-two').click()
    await page.getByTestId('toggle-counter-two').click()

    await expect(page.getByTestId('hook-two-activate-count')).toHaveText('0')
  })
})
