// Golden parse output: `npm run parse:golden` records every fixture's parsed output,
// `npm run parse:golden -- --compare` re-parses and fails on any changed value.
// Refactors of the parse pipeline must leave the comparison clean.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const mode = args.includes('--compare') ? 'compare' : 'write';
const only = args.find((a) => !a.startsWith('--'));

const res = spawnSync('npx', ['vitest', 'run', '--config', 'tools/parse-golden/vitest.config.mjs'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, GOLDEN_MODE: mode, GOLDEN_ONLY: only ?? '', VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
});
process.exit(res.status ?? 1);
