// Bundles the Web Workers into public/ as standalone classic workers.
//
// Why this exists instead of `new Worker(new URL(...), import.meta.url)`: Turbopack does not compile
// worker entries under `output: 'export'` - it copies the file to static/media verbatim, bare import
// statements and all, so it 404s at runtime. Building them here keeps the app on Turbopack.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const WORKERS = [
  { entry: 'workers/constructionOptimizer.worker.js', outfile: 'public/construction-optimizer.worker.js' },
  {
    entry: 'workers/parse.worker.js',
    outfile: 'public/parse.worker.js',
    // The parsers use the tsconfig path aliases, and utility/helpers pulls in .jsx-syntax .js files.
    options: { tsconfig: 'tsconfig.json', loader: { '.js': 'jsx' }, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } }
  }
];

for (const { entry, outfile, options } of WORKERS) {
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    // iife, not esm, so it loads as a classic worker and needs no `{ type: 'module' }` at the call site.
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    ...options
  });
  const output = await readFile(outfile);
  const hash = createHash('sha256').update(output).digest('hex').slice(0, 8);
  console.log(`Built ${outfile} - ${(output.length / 1024).toFixed(1)} KB, sha256 ${hash}`);
}
