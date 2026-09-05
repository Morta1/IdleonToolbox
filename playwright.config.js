import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // An allowlist, not a glob: a new spec file runs only once it is named here. A spec left out
  // collects zero tests and the suite still reports success.
  testMatch: ['smoke-*.spec.js', 'logged-out.spec.js', 'logged-out-nav.spec.js', 'no-nan.spec.js', 'static-head.spec.js', 'builds-parity.spec.js', 'builds-static-pages.spec.js', 'lcp-shell.spec.js'],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3002',
    headless: true,
  },
  webServer: {
    command: 'npm run serve:e2e',
    url: 'http://localhost:3002',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
