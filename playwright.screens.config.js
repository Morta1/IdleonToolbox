import { defineConfig } from '@playwright/test';

// E2E_PORT lets two checkouts run side by side; npm run serve:e2e reads the same variable.
const PORT = Number(process.env.E2E_PORT ?? 3002);
const BASE_URL = `http://localhost:${PORT}`;

// SCREENS_SCHEME=light shoots every route with the light scheme stored, into its own folder, so it never touches dark's.
// npm runs a script through cmd.exe on Windows, which can't parse VAR=x, so the :light scripts are told by their name.
// They call playwright without npx, which renames the event to its own and turns the run into a dark one, baselines included.
const LIGHT = process.env.SCREENS_SCHEME === 'light' || process.env.npm_lifecycle_event?.endsWith(':light');
const DIRS = LIGHT
  ? { full: '.screens-light', region: '.screens-light/region', report: '.screens-light/report' }
  : { full: '.screens', region: '.screens-region', report: '.screens-report' };

// Visual diff for the redesign: one full-page screenshot per route, desktop and phone. Not part of
// test:e2e. Baselines live in .screens (gitignored): screens:base writes them, screens:diff compares.
// The two sizes are the site's two most common visitor screens.
export default defineConfig({
  testDir: './e2e',
  testMatch: ['screens.spec.js'],
  // What e2e/screens.spec.js checks <html> against before a shot.
  metadata: { scheme: LIGHT ? 'light' : 'dark' },
  // A region run (SCREENS_REGION, e2e/screens.spec.js) keeps its own baselines, so it never touches the full ones.
  snapshotPathTemplate: `${process.env.SCREENS_REGION ? DIRS.region : DIRS.full}/{projectName}/{arg}{ext}`,
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
  reporter: [['list'], ['html', { outputFolder: DIRS.report, open: 'never' }], ['json', { outputFile: `${DIRS.full}/last-run.json` }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    // Consent already declined, so the cookie banner stays out of every screenshot.
    storageState: {
      cookies: [{ name: 'idleon-consent', value: 'false', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
      origins: LIGHT ? [{ origin: BASE_URL, localStorage: [{ name: 'mui-mode', value: 'light' }] }] : []
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
