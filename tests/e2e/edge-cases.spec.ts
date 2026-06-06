import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/edge-cases'

test.describe('edge cases', () => {
  test('initial-location accepts a named route object', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('edge-named-panel').getByTestId('page-b-content')).toBeVisible()
  })

  test('duplicate context name warns, skips registration and does not crash', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text())
    })

    await page.goto(PAGE)

    // The first context with the name works normally
    await expect(page.getByTestId('edge-dup-first').getByTestId('page-a-content')).toBeVisible()

    // The second one still renders its slot (passthrough, no own router context)
    await expect(page.getByTestId('edge-dup-second-slot')).toBeVisible()

    expect(warnings.some((w) => w.includes('"edge-dup" already registered'))).toBe(true)
  })
})
