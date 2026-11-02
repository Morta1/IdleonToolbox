import { defineConfig } from '@playwright/test';

// E2E_PORT lets two checkouts run side by side; npm run serve:e2e reads the same variable.
const PORT = Number(process.env.E2E_PORT ?? 3002);

// Visual diff for the redesign: one full-page screenshot per route, desktop and phone. Not part of
// test:e2e. Baselines live in .screens (gitignored): screens:base writes them, screens:diff compares.
// The two sizes are the site's two most common visitor screens.
export default defineConfig({
  testDir: './e2e',
  testMatch: ['screens.spec.js'],
  // A region run (SCREENS_REGION, e2e/screens.spec.js) keeps its own baselines, so it never touches the full ones.
  snapshotPathTemplate: process.env.SCREENS_REGION ? '.screens-region/{projectName}/{arg}{ext}' : '.screens/{projectName}/{arg}{ext}',
  timeout: 60_000,
  // threshold is the per-pixel color distance Playwright ignores (0.2 by default). A color task that
  // shifts a shade only slightly runs with SCREENS_THRESHOLD=0.02 to prove where it landed.
  expect: {
    timeout: 20_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      threshold: Number(process.env.SCREENS_THRESHOLD ?? 0.2),
      animations: 'disabled',
      caret: 'hide'
    }
  },
  fullyParallel: true,
  // 4 workers left most of the machine idle (100 s for the full run); 12 took 56 s with the same verdicts.
  workers: 12,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: '.screens-report', open: 'never' }], ['json', { outputFile: '.screens/last-run.json' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    // Consent already declined, so the cookie banner stays out of every screenshot.
    storageState: {
      cookies: [{ name: 'idleon-consent', value: 'false', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
      origins: []
    }
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1920, height: 950 } } },
    { name: 'phone', use: { viewport: { width: 384, height: 832 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
  ],
  webServer: {
    command: 'npm run serve:e2e',
    url: `http://localhost:${PORT}`,
    // A fresh server per run: one kept alive across several runs (about 2,400 page loads) died mid-run with
    // EMFILE, which failed every shot after it. A server already on the port makes the run stop at once instead.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
