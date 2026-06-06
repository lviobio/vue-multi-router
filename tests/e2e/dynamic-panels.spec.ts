import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const PAGE = 'http://localhost:5176/e2e/dynamic-panels'

test.describe('dynamic contexts (add/remove)', () => {
  test('adding a panel registers and activates a new context', async ({ page }) => {
    await page.goto(PAGE)

    await expect(page.getByTestId('panel-1')).toBeVisible()

    await page.getByTestId('add-panel').click()

    await expect(page.getByTestId('panel-2')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')
    await expect(page.getByTestId('panel-2-is-active')).toHaveText('true')
  })

  test('each panel keeps independent navigation state', async ({ page }) => {
    await page.goto(PAGE)

    await page.getByTestId('add-panel').click()
    await expect(page.getByTestId('panel-2')).toBeVisible()

    await page.getByTestId('panel-1-input').fill('one')
    await page.getByTestId('panel-2-input').fill('two')

    await expect(page.getByTestId('panel-1-fullpath')).toHaveText('/query-page?value=one')
    await expect(page.getByTestId('panel-2-fullpath')).toHaveText('/query-page?value=two')
  })

  test('clicking the remove button does not activate the panel (prevent-class)', async ({
    page,
  }) => {
    await page.goto(PAGE)

    await page.getByTestId('add-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')

    // The remove button matches prevent-class="panel-remove", so the mousedown
    // on it must not activate panel-1 before removing it
    await page.getByTestId('remove-panel-1').click()

    await expect(page.getByTestId('panel-1')).not.toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')
  })

  test('removing the active panel falls back to the previously active context', async ({
    page,
  }) => {
    await page.goto(PAGE)

    await page.getByTestId('add-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')

    await page.getByTestId('panel-1-input').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-1')

    await page.getByTestId('remove-panel-1').click()

    await expect(page.getByTestId('panel-1')).not.toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')
  })

  test('removing the active panel returns the browser URL to the previous history context', async ({
    page,
  }) => {
    await page.goto(PAGE)

    await page.getByTestId('add-panel').click()
    await expect(page.getByTestId('active-context')).toHaveText('panel-2')

    await page.getByTestId('panel-2-input').fill('asd')
    await expect(page).toHaveURL('http://localhost:5176/e2e/query-page?value=asd')

    await page.getByTestId('remove-panel-2').click()

    await expect(page.getByTestId('panel-2')).toHaveCount(0)
    // The URL must not keep pointing at the removed context's route
    await expect(page).toHaveURL(PAGE)
  })

  test('reload after removing the active panel renders the fixture, not the dead panel route', async ({
    page,
  }) => {
    await page.goto(PAGE)

    await page.getByTestId('add-panel').click()
    await page.getByTestId('panel-2-input').fill('asd')
    await expect(page).toHaveURL('http://localhost:5176/e2e/query-page?value=asd')
    await page.getByTestId('remove-panel-2').click()

    await page.reload()

    // Before the fix, `main` adopted the stale /query-page?value=asd URL and
    // rendered the dead panel's content fullscreen
    await expect(page.getByTestId('add-panel')).toBeVisible()
    await expect(page.getByTestId('panel-1')).toBeVisible()
    await expect(page.getByTestId('main-input')).toHaveCount(0)
    await expect(page).toHaveURL(PAGE)
  })

  test('panels and their state are restored after a reload', async ({ page }) => {
    await page.goto(PAGE)

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
})
