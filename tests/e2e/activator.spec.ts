import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/activator'

test.describe('context activation via activator', () => {
  test('mousedown inside a context with the built-in activator activates it', async ({ page }) => {
    await page.goto(PAGE)

    // The default "main" context is active on a fresh load
    await expect(page.getByTestId('active-context')).toHaveText('main')
    await expect(page.getByTestId('act-one-is-active')).toHaveText('false')

    // Click the panel padding (the center could land on the prevent-class button)
    await page.getByTestId('act-one-panel').click({ position: { x: 5, y: 5 } })

    await expect(page.getByTestId('active-context')).toHaveText('act-one')
    await expect(page.getByTestId('act-one-is-active')).toHaveText('true')
  })

  test('mousedown inside a context with activator disabled does not activate it', async ({
    page,
  }) => {
    await page.goto(PAGE)

    await page.getByTestId('act-one-panel').click({ position: { x: 5, y: 5 } })
    await expect(page.getByTestId('active-context')).toHaveText('act-one')

    // Panel Two opts out of the built-in activator (:activator="false")
    await page.getByTestId('act-two-outside').click()

    await expect(page.getByTestId('active-context')).toHaveText('act-one')
    await expect(page.getByTestId('act-two-is-active')).toHaveText('false')
  })

  test('MultiRouterContextActivator activates the surrounding context', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('act-two-activator').click()

    await expect(page.getByTestId('active-context')).toHaveText('act-two')
    await expect(page.getByTestId('act-two-is-active')).toHaveText('true')
  })

  test('clicking an element matching prevent-class does not activate the context', async ({
    page,
  }) => {
    await page.goto(PAGE)

    await page.getByTestId('act-two-activator').click()
    await expect(page.getByTestId('active-context')).toHaveText('act-two')

    // Panel One declares prevent-class="no-activate" and the button has that class
    await page.getByTestId('act-one-prevent').click()

    await expect(page.getByTestId('active-context')).toHaveText('act-two')
    await expect(page.getByTestId('act-one-is-active')).toHaveText('false')
  })
})
