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

async function clickUntilPath(page, locator, expectedPath, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  while (new URL(page.url()).pathname !== expectedPath && Date.now() < deadline) {
    await locator.click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await waitForRender(page);
  expect(new URL(page.url()).pathname).toBe(expectedPath);
}

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

    await clickUntilPath(page, page.locator('[data-cy="nav-item-account/misc/general"]'), '/account/misc/general');

    const prayersLink = page.locator('[data-cy="prayers"]');
    await click(page.locator('[data-cy="world 3"]'));
    await expect(prayersLink).toBeVisible();
    await clickUntilPath(page, prayersLink, '/account/world-3/prayers');

    const bodyText = await page.locator('body').innerText();
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

    await clickUntilPath(page, page.locator('[data-cy="nav-item-tools/card-search"]'), '/tools/card-search');

    const materialTrackerLink = page.locator('a[href^="/tools/material-tracker"]').first();
    await expect(materialTrackerLink).toBeVisible();
    await clickUntilPath(page, materialTrackerLink, '/tools/material-tracker');

    const bodyText = await page.locator('body').innerText();
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

    const searchInput = page.getByPlaceholder('Search pages...');
    await expect(async () => {
      await click(page.getByText('Ctrl + K'));
      await expect(searchInput).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });

    await searchInput.fill('Material Tracker');
    const result = page.getByRole('dialog').getByText('Material Tracker', { exact: false }).first();
    await expect(result).toBeVisible();
    await clickUntilPath(page, result, '/tools/material-tracker');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Add tracker for all greenstacks');
    assertNoErrorBoundary(bodyText);
    expect(errors).toEqual([]);

    await context.close();
  });
});
