import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/location-control'

test.describe('location prop and v-model:location', () => {
  test('renders the initial controlled location', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('loc-str-panel').getByTestId('page-a-content')).toBeVisible()
    await expect(page.getByTestId('str-location')).toHaveText('/page-a')
  })

  test('changing the location prop forces the context to the new location', async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('loc-str-panel').getByTestId('page-a-content')).toBeVisible()

    await page.getByTestId('set-str-page-b').click()

    await expect(page.getByTestId('loc-str-panel').getByTestId('page-b-content')).toBeVisible()
    await expect(page.getByTestId('loc-str-panel').getByTestId('page-a-content')).not.toBeVisible()
  })

  test('in-context navigation updates the v-model value', async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('str-location')).toHaveText('/page-a')

    await page.getByTestId('loc-str-go-page-b').click()

    await expect(page.getByTestId('loc-str-panel').getByTestId('page-b-content')).toBeVisible()
    await expect(page.getByTestId('str-location')).toHaveText('/page-b')
  })

  test('location accepts a named route object', async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('loc-obj-panel').getByTestId('page-a-content')).toBeVisible()

    await page.getByTestId('set-obj-page-b').click()

    await expect(page.getByTestId('loc-obj-panel').getByTestId('page-b-content')).toBeVisible()
  })

  test('update:location emits a resolved route object when the prop is an object', async ({
    page,
  }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('loc-obj-panel').getByTestId('page-a-content')).toBeVisible()

    await page.getByTestId('loc-obj-go-page-b').click()

    await expect(page.getByTestId('loc-obj-panel').getByTestId('page-b-content')).toBeVisible()
    await expect(page.getByTestId('obj-emitted-fullpath')).toHaveText('/page-b')
    await expect(page.getByTestId('obj-emitted-type')).toHaveText('object')
  })
})
