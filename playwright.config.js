import { defineConfig } from '@playwright/test';

// E2E_PORT lets two checkouts run side by side; npm run serve:e2e reads the same variable.
const PORT = Number(process.env.E2E_PORT ?? 3002);

export default defineConfig({
  testDir: './e2e',
  // An allowlist, not a glob: a new spec file runs only once it is named here. A spec left out
  // collects zero tests and the suite still reports success.
  testMatch: ['smoke-*.spec.js', 'logged-out.spec.js', 'logged-out-nav.spec.js', 'no-nan.spec.js', 'static-head.spec.js', 'builds-parity.spec.js', 'builds-static-pages.spec.js', 'chunk-audit.spec.js', 'hydration.spec.js', 'wiki-listing.spec.js', 'wardrobe.spec.js', 'whats-new.spec.js'],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
  },
  webServer: {
    command: 'npm run serve:e2e',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
