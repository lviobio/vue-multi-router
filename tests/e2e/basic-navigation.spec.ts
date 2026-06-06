import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/basic-navigation'

test.describe('basic in-context navigation', () => {
  test('renders Page A content on initial load', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('page-a-content')).toBeVisible()
  })

  test('clicking the Page B link navigates to Page B within the context', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('go-page-b').click()

    await expect(page.getByTestId('page-b-content')).toBeVisible()
    await expect(page.getByTestId('page-a-content')).not.toBeVisible()
  })

  test('clicking the Page A link after navigating to B returns to Page A', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('go-page-b').click()
    await expect(page.getByTestId('page-b-content')).toBeVisible()

    await page.getByTestId('go-page-a').click()
    await expect(page.getByTestId('page-a-content')).toBeVisible()
    await expect(page.getByTestId('page-b-content')).not.toBeVisible()
  })
})
