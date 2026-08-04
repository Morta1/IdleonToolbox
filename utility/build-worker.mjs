// Bundles the construction optimizer worker into public/ as a standalone classic worker.
//
// Why this exists instead of `new Worker(new URL(...), import.meta.url)`: Turbopack does not compile
// worker entries under `output: 'export'` - it copies the file to static/media verbatim, bare import
// statements and all, so it 404s at runtime. Building it here keeps the app on Turbopack.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const OUTFILE = 'public/construction-optimizer.worker.js';

await build({
  entryPoints: ['workers/constructionOptimizer.worker.js'],
  outfile: OUTFILE,
  bundle: true,
  // iife, not esm, so it loads as a classic worker and needs no `{ type: 'module' }` at the call site.
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  legalComments: 'none'
});

const output = await readFile(OUTFILE);
const hash = createHash('sha256').update(output).digest('hex').slice(0, 8);
console.log(`Built ${OUTFILE} - ${(output.length / 1024).toFixed(1)} KB, sha256 ${hash}`);
