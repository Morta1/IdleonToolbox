// Verifies Task 9: anonymous visitors can *reach* previously-gated pages by clicking through the
// nav, the tools drawer, and QuickSearch - not just by pasting a URL. logged-out.spec.js (Task 8)
// proved pages render on a direct goto(); it never proved a real visitor could click their way
// there, which is exactly the gap this task closes.
//
// KNOWN LIMITATION: every navigational click below uses `dispatchEvent('click')` (see the `click`
// helper) instead of Playwright's `locator.click()`, to route around a dev-only overlay - see the
// comment on that helper for why. This forfeits Playwright's actionability hit-test, i.e. these
// tests do NOT verify the target element is visible, unobscured, and actually receives pointer
// events in the way a real mouse click would. They also only ever run against `next dev` (see
// `playwright.config.js`'s `webServer.command`), never against a production `npm run build` +
// `npm start` server. A genuine production-only obstruction - a real overlay left over a link, a
// `pointer-events: none` bug, anything that would make a real user's click miss the target - is
// not something this suite would catch. It proves the click handlers and routing are wired up
// correctly once an event reaches the element; it does not prove the element is clickable by a
// real cursor in production.
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

// A click dispatched before React has hydrated the link does nothing at all - silently. The fixed
// `waitForTimeout` sleeps this file used to rely on were sized for a quiet dev server; once the
// suite went fullyParallel, `next dev` could still be compiling when the first click landed, and
// this test started failing on machine load rather than on anything about the app.
//
// Re-dispatching until the router actually moves fixes that at the source. It is only safe for
// clicks whose effect is idempotent - navigating to a link that is already the current page is a
// no-op, so an extra dispatch costs nothing. Do NOT use it for a toggle (the drawer's world
// sections), where a second dispatch would undo the first.
async function clickUntilPath(page, locator, expectedPath, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  while (new URL(page.url()).pathname !== expectedPath && Date.now() < deadline) {
    await locator.dispatchEvent('click').catch(() => {});
    await page.waitForTimeout(400);
  }
  await page.waitForLoadState('networkidle');
  expect(new URL(page.url()).pathname).toBe(expectedPath);
}

// networkidle fires once JS chunks are loaded, but React hydration (which is what makes the nav
// links interactive) finishes shortly after. Waiting for a nav item to actually exist beats the
// fixed sleep that used to stand here: under a loaded dev server that sleep could expire before the
// nav rendered at all, which made the reads below see an empty list.
async function gotoHomeAndWait(page) {
  await page.goto('http://localhost:3001/');
  await page.waitForLoadState('networkidle');
  await page.locator('nav [data-cy^="nav-item-"]').first().waitFor({ state: 'attached' });
  await page.waitForTimeout(500);
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
    await demoPage.goto('http://localhost:3001/?demo=true');
    await demoPage.waitForLoadState('networkidle');
    // Same reason as gotoHomeAndWait: read the nav once it exists, not once a timer expires.
    await demoPage.locator('nav [data-cy^="nav-item-"]').first().waitFor({ state: 'attached' });
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
