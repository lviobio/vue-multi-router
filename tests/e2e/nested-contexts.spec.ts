import { test, expect } from '@playwright/test'

// Drives the dedicated e2e playground (vite.e2e.config.ts, served at :5176 under `/e2e/`).
const BASE = 'http://localhost:5176/e2e'

// First-class nested contexts: a MultiRouterContext rendered inside another
// context's content. The library auto-detects the parent and uses it for
// activation fallback (and restore). See NestedContexts.vue / NestedPanel.vue.
test.describe('nested contexts', () => {
  test('exposes parent + depth for each nesting level', async ({ page }) => {
    await page.goto(`${BASE}/nested-contexts`)

    // Base panel `np` is nested inside the app's `main` context.
    await expect(page.getByTestId('parent-np')).toHaveText('main')
    await expect(page.getByTestId('depth-np')).toHaveText('1')

    await page.getByTestId('open-np').click()
    await expect(page.getByTestId('parent-np-1')).toHaveText('np')
    await expect(page.getByTestId('depth-np-1')).toHaveText('2')

    await page.getByTestId('open-np-1').click()
    await expect(page.getByTestId('parent-np-2')).toHaveText('np-1')
    await expect(page.getByTestId('depth-np-2')).toHaveText('3')
  })

  test('opening a child activates it and changes the URL', async ({ page }) => {
    await page.goto(`${BASE}/nested-contexts`)
    await expect(page.getByTestId('active-context')).toHaveText('np')
    await expect(page).toHaveURL(`${BASE}/np/0`)

    await page.getByTestId('open-np').click()
    await expect(page.getByTestId('active-context')).toHaveText('np-1')
    await expect(page).toHaveURL(`${BASE}/np/1`)

    await page.getByTestId('open-np-1').click()
    await expect(page.getByTestId('active-context')).toHaveText('np-2')
    await expect(page).toHaveURL(`${BASE}/np/2`)
  })

  test('closing a child hands activation back to its PARENT (not main / a flat stack)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/nested-contexts`)
    await page.getByTestId('open-np').click()
    await page.getByTestId('open-np-1').click()
    await expect(page.getByTestId('active-context')).toHaveText('np-2')

    // Close the deepest panel — the fixture does NOT call setActive on close;
    // the library re-activates the parent on its own.
    await page.getByTestId('close-np-2').click()
    await expect(page.getByTestId('panel-np-2')).toHaveCount(0)
    await expect(page.getByTestId('active-context')).toHaveText('np-1')
    await expect(page).toHaveURL(`${BASE}/np/1`)

    await page.getByTestId('close-np-1').click()
    await expect(page.getByTestId('panel-np-1')).toHaveCount(0)
    await expect(page.getByTestId('active-context')).toHaveText('np')
    await expect(page).toHaveURL(`${BASE}/np/0`)
  })

  test('a stacked nesting is restored after a reload, and closing still falls back to the parent', async ({
    page,
  }) => {
    await page.goto(`${BASE}/nested-contexts`)
    await page.getByTestId('open-np').click()
    await expect(page.getByTestId('active-context')).toHaveText('np-1')
    await expect(page).toHaveURL(`${BASE}/np/1`)

    await page.reload()

    // The nested stack is rebuilt and the deepest level owns the URL again.
    await expect(page.getByTestId('panel-np')).toBeVisible()
    await expect(page.getByTestId('panel-np-1')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('np-1')
    await expect(page).toHaveURL(`${BASE}/np/1`)

    // Closing after a reload still hands activation back to the parent (the bug
    // this whole feature fixes: the base panel must not disappear with the child).
    await page.getByTestId('close-np-1').click()
    await expect(page.getByTestId('panel-np-1')).toHaveCount(0)
    await expect(page.getByTestId('panel-np')).toBeVisible()
    await expect(page.getByTestId('active-context')).toHaveText('np')
    await expect(page).toHaveURL(`${BASE}/np/0`)
  })

  test('restoring a nesting does not churn browser history (default activation, push mode)', async ({
    page,
  }) => {
    // push mode makes context switches add real history entries, so churn is
    // observable as a growing history.length. The default (immediate) strategy
    // is used — no stabilizationActivation opt-in.
    await page.addInitScript(() => sessionStorage.setItem('e2e-switch-mode', 'push'))
    await page.goto(`${BASE}/nested-contexts`)
    await page.getByTestId('open-np').click()
    await expect(page).toHaveURL(`${BASE}/np/1`)

    const before = await page.evaluate(() => history.length)
    await page.reload()
    await expect(page.getByTestId('active-context')).toHaveText('np-1')
    await expect(page).toHaveURL(`${BASE}/np/1`)
    const after = await page.evaluate(() => history.length)

    // The restore activates only the deepest level (a replace matching the URL).
    // Without the built-in deferral, the default + ancestor would each push first.
    expect(after).toBe(before)

    // A single back press lands on the base — no churned duplicate entries.
    await page.goBack()
    await expect(page).toHaveURL(`${BASE}/np/0`)
    await expect(page.getByTestId('active-context')).toHaveText('np')
  })
})
