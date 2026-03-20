import { test as base, expect } from '@playwright/test';
import { PAGES } from '../components/constants.jsx';

// ---------------------------------------------------------------------------
// Custom fixture: one demo-loaded page per worker
// ---------------------------------------------------------------------------

export const test = base.extend({
  demoPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3001/dashboard?demo=true');
    await page.waitForLoadState('networkidle');
    await use(page);
    await context.close();
  }, { scope: 'worker' }],
});

export { expect };

// ---------------------------------------------------------------------------
// Route generation from PAGES
// ---------------------------------------------------------------------------

function labelToPath(label) {
  return label.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getTabName(t) {
  return typeof t === 'string' ? t : t.tab;
}

function sectionToPath(section) {
  return section.replace(/\s+/g, '-');
}

const SKIP_GENERAL = new Set(['guilds', 'statistics', 'leaderboards']);

export function getAllTestCases() {
  const cases = [];

  for (const page of Object.keys(PAGES.GENERAL)) {
    if (!SKIP_GENERAL.has(page)) {
      cases.push({ name: `/${page}`, path: `/${page}`, query: {} });
    }
  }

  for (const [section, { categories }] of Object.entries(PAGES.ACCOUNT)) {
    for (const category of categories) {
      const basePath = `/account/${sectionToPath(section)}/${labelToPath(category.label)}`;
      const tabs = category.tabs?.map(getTabName).filter(Boolean) ?? [];

      if (tabs.length === 0) {
        cases.push({ name: basePath, path: basePath, query: {} });
        continue;
      }

      for (const tab of tabs) {
        const nestedForTab = category.nestedTabs?.filter((nt) => nt.tab === tab) ?? [];

        if (nestedForTab.length === 0) {
          cases.push({ name: `${basePath} [${tab}]`, path: basePath, query: { t: tab } });
          continue;
        }

        for (const nested of nestedForTab) {
          const deepNested = nested.nestedTabs ?? [];
          if (deepNested.length === 0) {
            cases.push({
              name: `${basePath} [${tab} > ${nested.nestedTab}]`,
              path: basePath,
              query: { t: tab, nt: nested.nestedTab },
            });
          } else {
            for (const dnt of deepNested) {
              cases.push({
                name: `${basePath} [${tab} > ${nested.nestedTab} > ${dnt}]`,
                path: basePath,
                query: { t: tab, nt: nested.nestedTab, dnt },
              });
            }
          }
        }
      }
    }
  }

  for (const tool of Object.keys(PAGES.TOOLS)) {
    const path = `/tools/${labelToPath(tool)}`;
    cases.push({ name: path, path, query: {} });
  }

  return cases;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function clientNavigate(page, pathname, query = {}) {
  await page.evaluate(({ pathname, query }) => {
    window.next.router.push({ pathname, query: { demo: 'true', ...query } });
  }, { pathname, query });
  await page.waitForTimeout(800);
}

export function collectErrors(page) {
  const errors = new Set();
  const handler = (err) => errors.add(err.message);
  page.on('pageerror', handler);
  return { errors, cleanup: () => page.off('pageerror', handler) };
}
