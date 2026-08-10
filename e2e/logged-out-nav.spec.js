// Verifies Task 9: anonymous visitors can *reach* previously-gated pages by clicking through the
// nav, the tools drawer, and QuickSearch - not just by pasting a URL. logged-out.spec.js (Task 8)
// proved pages render on a direct goto(); it never proved a real visitor could click their way
// there, which is exactly the gap this task closes.
import { test, expect } from '@playwright/test';

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

function assertNoErrorBoundary(bodyText) {
  expect(bodyText).not.toContain('This page failed to render');
  expect(bodyText).not.toContain('The app failed to load');
}

// Next.js's dev-mode indicator renders a <nextjs-portal> host that, depending on state, sits on
// top of the page and swallows real (coordinate-based) mouse clicks aimed at elements underneath
// it - a dev-server-only artifact (absent from `npm run build` output), unrelated to the app under
// test. `locator.click()` (even with `force: true`) still performs a real hit-test at the target's
// coordinates and gets intercepted. `dispatchEvent('click')` fires the click DOM event directly on
// the target node instead, which still runs the exact same React/Next.js click handling (bubbling
// through the real anchor and its onClick), so it verifies the same thing a real click would
// without depending on nothing else being stacked on top of it.
async function click(locator) {
  await locator.dispatchEvent('click');
}

// networkidle fires once JS chunks are loaded, but React hydration (which is what makes the nav
// links interactive) finishes shortly after - give it a beat before the first click of a test.
async function gotoHomeAndWait(page) {
  await page.goto('http://localhost:3001/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

test.describe.configure({ mode: 'serial' });

test.describe('Logged-out visitors reach gated pages by clicking, not just by URL', () => {
  test('homepage -> Account nav link -> World 3 -> Prayers, purely by clicking', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    const page = await context.newPage();
    const errors = collectErrors(page);

    await gotoHomeAndWait(page);

    // Click the top nav "Account" link - no goto() of an account URL. Before this task this item
    // was hidden entirely for a logged-out visitor.
    await click(page.locator('[data-cy="nav-item-account/misc/general"]'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe('/account/misc/general');

    // Now on an account page, the permanent AccountDrawer is visible on the left. Expand World 3
    // and click into Prayers - again, clicks only.
    await click(page.locator('[data-cy="world 3"]'));
    await click(page.locator('[data-cy="prayers"]'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    expect(new URL(page.url()).pathname).toBe('/account/world-3/prayers');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
    assertNoErrorBoundary(bodyText);
    expect(errors).toEqual([]);

    await context.close();
  });

  test('logged-out nav exposes the same top-level sections as demo mode', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });

    const loggedOutPage = await context.newPage();
    await gotoHomeAndWait(loggedOutPage);
    const loggedOutItems = (await loggedOutPage.locator('nav [data-cy^="nav-item-"]').allTextContents())
      .map((t) => t.trim())
      .sort();

    const demoPage = await context.newPage();
    await demoPage.goto('http://localhost:3001/?demo=true');
    await demoPage.waitForLoadState('networkidle');
    await demoPage.waitForTimeout(500);
    const demoItems = (await demoPage.locator('nav [data-cy^="nav-item-"]').allTextContents())
      .map((t) => t.trim())
      .sort();

    expect(loggedOutItems.length).toBeGreaterThan(0);
    expect(loggedOutItems).toEqual(demoItems);

    await context.close();
  });

  test('Tools drawer lists and links to a previously-offline tool (Material Tracker)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    const page = await context.newPage();
    const errors = collectErrors(page);

    await gotoHomeAndWait(page);

    // Click the top nav "Tools" link, which lands on Card Search (an always-offline tool) and
    // shows the permanent ToolsDrawer.
    await click(page.locator('[data-cy="nav-item-tools/card-search"]'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe('/tools/card-search');

    // Material Tracker was NOT in offlineTools, so before this task it was hidden from a
    // logged-out visitor entirely. It must now be listed and clickable.
    const materialTrackerLink = page.locator('a[href^="/tools/material-tracker"]').first();
    await expect(materialTrackerLink).toBeVisible();
    await click(materialTrackerLink);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    expect(new URL(page.url()).pathname).toBe('/tools/material-tracker');

    const bodyText = await page.locator('body').innerText();
    assertNoErrorBoundary(bodyText);
    expect(errors).toEqual([]);

    await context.close();
  });

  test('QuickSearch returns and opens a previously-hidden page for a logged-out visitor', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    const page = await context.newPage();

    await gotoHomeAndWait(page);

    // Open QuickSearch by clicking its trigger (not the Ctrl+K hotkey).
    await click(page.getByText('Ctrl + K'));
    const searchInput = page.getByPlaceholder('Search pages...');
    await expect(searchInput).toBeVisible();

    // "Material Tracker" was excluded from search results for logged-out visitors before this task.
    // Scope to the dialog - the homepage's own patch notes mention "Material Tracker" in plain
    // text behind the modal, which would otherwise be matched first.
    await searchInput.fill('Material Tracker');
    const result = page.getByRole('dialog').getByText('Material Tracker', { exact: false }).first();
    await expect(result).toBeVisible();
    await click(result);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe('/tools/material-tracker');

    await context.close();
  });
});
