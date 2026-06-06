import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
// The /stabilization fixture mounts its panels ~100ms after the app boots, simulating
// async boundaries (e.g. <Suspense>). The playground enables the stabilization strategy
// when `e2e-activation-strategy` is set in sessionStorage (see router.ts).
const PAGE = 'http://localhost:5176/e2e/stabilization'
const BASE = 'http://localhost:5176/e2e'

test.describe('stabilization activation strategy', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('e2e-activation-strategy', 'stabilization'))
  })

  test('activates the default context once registrations stabilize', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('stab-a-panel')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('main')
  })

  test('restores the saved active context even when it registers late', async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('stab-b-panel')).toBeVisible()

    await page.getByTestId('stab-b-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('stab-b')

    await page.reload()

    // The panels register ~100ms after `main`; the stabilization strategy waits
    // for the debounce window and then restores the saved context anyway
    await expect(page.getByTestId('active-context')).toHaveText('stab-b')
    await expect(page).toHaveURL(`${BASE}/page-b`)
  })
})

test.describe('immediate activation strategy (default) with late contexts', () => {
  test('cannot restore a context that registers after the default has activated', async ({
    page,
  }) => {
    await page.goto(PAGE)
    await expect(page.getByTestId('stab-b-panel')).toBeVisible()

    await page.getByTestId('stab-b-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('stab-b')

    await page.reload()

    // With the immediate strategy the default `main` context activates before
    // the late panels register, so the saved context is not restored.
    // This documents the limitation that stabilizationActivation() solves.
    await expect(page.getByTestId('stab-b-panel')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('main')
  })
})
