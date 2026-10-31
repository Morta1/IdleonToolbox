import { defineConfig } from '@playwright/test';

// Visual diff for the redesign: one full-page screenshot per route, desktop and phone. Not part of
// test:e2e. Baselines live in .screens (gitignored): screens:base writes them, screens:diff compares.
// The two sizes are the site's two most common visitor screens.
export default defineConfig({
  testDir: './e2e',
  testMatch: ['screens.spec.js'],
  snapshotPathTemplate: '.screens/{projectName}/{arg}{ext}',
  timeout: 60_000,
  expect: { timeout: 20_000, toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled', caret: 'hide' } },
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: '.screens-report', open: 'never' }]],
  use: { baseURL: 'http://localhost:3002', headless: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1920, height: 950 } } },
    { name: 'phone', use: { viewport: { width: 384, height: 832 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
  ],
  webServer: {
    command: 'npm run serve:e2e',
    url: 'http://localhost:3002',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
