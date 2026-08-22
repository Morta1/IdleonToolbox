import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Inlined rather than imported from utility/ports.mjs: Playwright transpiles this config
// to CommonJS, so it can neither require a real ES module nor use import.meta. The path is
// relative to the cwd, which is the worktree root when run through the npm scripts. Keep the slot
// formula here in sync with utility/ports.mjs.
const readSlot = () => {
  if (process.env.IT_SLOT) return Number(process.env.IT_SLOT) || 0;
  try {
    return Number(readFileSync('.worktree-slot', 'utf8').trim()) || 0;
  } catch {
    return 0;
  }
};

const slot = readSlot();
const e2ePort = Number(process.env.E2E_PORT ?? 3002 + slot * 10);

export default defineConfig({
  testDir: './e2e',
  // An allowlist, not a glob: a new spec file runs only once it is named here. A spec left out
  // collects zero tests and the suite still reports success.
  testMatch: ['smoke-*.spec.js', 'logged-out.spec.js', 'logged-out-nav.spec.js', 'no-nan.spec.js', 'static-head.spec.js', 'builds-parity.spec.js', 'builds-static-pages.spec.js'],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${e2ePort}`,
    headless: true,
  },
  webServer: {
    // Built here rather than shelling out to `npm run serve:e2e` so the port survives
    // on Windows, where cmd.exe does not expand POSIX-style env placeholders.
    command: `npx serve@latest out -l ${e2ePort} --no-clipboard`,
    url: `http://localhost:${e2ePort}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
