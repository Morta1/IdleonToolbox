// Verifies Task 9: anonymous visitors can *reach* previously-gated pages by clicking through the
// nav, the tools drawer, and QuickSearch - not just by pasting a URL. logged-out.spec.js (Task 8)
// proved pages render on a direct goto(); it never proved a real visitor could click their way
// there, which is exactly the gap this task closes.
//
// Clicks are real `locator.click()` calls, so Playwright's actionability hit-test applies: an
// overlay or a `pointer-events: none` bug that would make a real user's click miss fails the test.
// These were `dispatchEvent('click')` while the suite ran against `next dev`, whose dev-mode
// overlay swallowed coordinate-based clicks; the static build has no such overlay.
import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

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

async function click(locator) {
  await locator.click();
}

// A click landing before React has hydrated the link does nothing, silently - actionability checks
// cover visibility, not "the handler is attached". Re-clicking until the router moves fixes that.
// Only safe for idempotent clicks: clicking a link to the page you are already on is a no-op. Do
// NOT use for a toggle (the drawer's world sections), where a second click undoes the first.
async function clickUntilPath(page, locator, expectedPath, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  while (new URL(page.url()).pathname !== expectedPath && Date.now() < deadline) {
    // A click can legitimately fail while the page settles; the expect below is what reports
    // failure, so a genuinely unclickable element still fails the test.
    await locator.click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await waitForRender(page);
  expect(new URL(page.url()).pathname).toBe(expectedPath);
}

// Waiting for a nav item to actually exist beats the fixed sleep that used to stand here: under a
// loaded dev server that sleep could expire before the nav rendered at all, which made the reads
// below see an empty list. waitForRender covers hydration settling; the locator wait then pins the
// one element these tests read, since a page can be settled overall while the nav is still empty.
async function gotoHomeAndWait(page) {
  await page.goto('/');
  await waitForRender(page);
  await page.locator('nav [data-cy^="nav-item-"]').first().waitFor({ state: 'attached' });
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
    await clickUntilPath(page, page.locator('[data-cy="nav-item-account/misc/general"]'), '/account/misc/general');

    // Now on an account page, the permanent AccountDrawer is visible on the left. Expand World 3
    // and click into Prayers - again, clicks only. The expand is a toggle, so it gets a single
    // dispatch and we wait for what it reveals rather than re-clicking it.
    const prayersLink = page.locator('[data-cy="prayers"]');
    await click(page.locator('[data-cy="world 3"]'));
    await expect(prayersLink).toBeVisible();
    await clickUntilPath(page, prayersLink, '/account/world-3/prayers');

    const bodyText = await page.locator('body').innerText();
    // A real prayer name from the catalog (stored as "Big_Brain_Time", rendered with spaces) - not
    // just non-empty text, which the nav chrome alone would already satisfy. This is the actual
    // catalog content the empty-account contract is supposed to produce.
    expect(bodyText).toContain('Big Brain Time');
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
    await demoPage.goto('/?demo=true');
    await waitForRender(demoPage);
    // Same reason as gotoHomeAndWait: read the nav once it exists, not once a timer expires.
    await demoPage.locator('nav [data-cy^="nav-item-"]').first().waitFor({ state: 'attached' });
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
    await clickUntilPath(page, page.locator('[data-cy="nav-item-tools/card-search"]'), '/tools/card-search');

    // Material Tracker was NOT in offlineTools, so before this task it was hidden from a
    // logged-out visitor entirely. It must now be listed and clickable.
    const materialTrackerLink = page.locator('a[href^="/tools/material-tracker"]').first();
    await expect(materialTrackerLink).toBeVisible();
    await clickUntilPath(page, materialTrackerLink, '/tools/material-tracker');

    const bodyText = await page.locator('body').innerText();
    // Page-specific text unique to Material Tracker's own UI (its "add every greenstack at once"
    // shortcut) - not just non-empty text, which the nav chrome alone would already satisfy.
    expect(bodyText).toContain('Add tracker for all greenstacks');
    assertNoErrorBoundary(bodyText);
    expect(errors).toEqual([]);

    await context.close();
  });

  test('QuickSearch returns and opens a previously-hidden page for a logged-out visitor', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    const page = await context.newPage();
    const errors = collectErrors(page);

    await gotoHomeAndWait(page);

    // Open QuickSearch by clicking its trigger (not the Ctrl+K hotkey).
    // Same hydration race as the nav clicks: dispatch until the dialog actually opens.
    const searchInput = page.getByPlaceholder('Search pages...');
    await expect(async () => {
      await click(page.getByText('Ctrl + K'));
      await expect(searchInput).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });

    // "Material Tracker" was excluded from search results for logged-out visitors before this task.
    // Scope to the dialog - the homepage's own patch notes mention "Material Tracker" in plain
    // text behind the modal, which would otherwise be matched first.
    await searchInput.fill('Material Tracker');
    const result = page.getByRole('dialog').getByText('Material Tracker', { exact: false }).first();
    await expect(result).toBeVisible();
    await clickUntilPath(page, result, '/tools/material-tracker');

    const bodyText = await page.locator('body').innerText();
    // Proves QuickSearch both found AND opened the page - landing on the URL alone doesn't rule
    // out an empty shell. Same string test 3 already verified is unique to this page.
    expect(bodyText).toContain('Add tracker for all greenstacks');
    assertNoErrorBoundary(bodyText);
    expect(errors).toEqual([]);

    await context.close();
  });
});
