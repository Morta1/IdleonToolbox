// `npm run parse:graph`: pass convergence and section dependency report in .parse-graph/report.md.
// PG_FIXTURES / PG_CONVERGE pick fixtures (comma-separated file names).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const res = spawnSync('npx', ['vitest', 'run', '--config', 'tools/parse-graph/vitest.config.mjs'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
});
if (res.status === 0) console.log(`Report: ${path.join(ROOT, '.parse-graph', 'report.md')}`);
process.exit(res.status ?? 1);
