import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/nested-host'
const BASE = 'http://localhost:5176/e2e'

test.describe('nested routes inside a context (multiRouterRoot)', () => {
  test('renders the multiRouterRoot route, skipping ancestor layout routes', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('nested-child-content')).toBeVisible()
    // The layout route above the multiRouterRoot route must not render inside the context
    await expect(page.getByTestId('nested-layout-marker')).toHaveCount(0)
  })

  test('nested RouterView inside the context renders deeper child routes', async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('nested-child-content')).toBeVisible()

    // The link click also activates the panel (mousedown), so the URL syncs too
    await page.getByTestId('go-deep').click()

    await expect(page.getByTestId('nested-deep-content')).toBeVisible()
    // The deep view renders inside the child view, not instead of it
    await expect(page.getByTestId('nested-child-content')).toBeVisible()
    await expect(page.getByTestId('nested-layout-marker')).toHaveCount(0)
    await expect(page).toHaveURL(`${BASE}/nested/child/deep`)
  })

  test('navigates between multiRouterRoot siblings', async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('nested-child-content')).toBeVisible()

    await page.getByTestId('go-child-b').click()

    await expect(page.getByTestId('nested-child-b-content')).toBeVisible()
    await expect(page.getByTestId('nested-child-content')).not.toBeVisible()
    await expect(page.getByTestId('nested-layout-marker')).toHaveCount(0)
    await expect(page).toHaveURL(`${BASE}/nested/child-b`)
  })
})
