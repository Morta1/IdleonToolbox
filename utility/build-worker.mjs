// Bundles the Web Workers into public/workers/ as standalone classic workers.
//
// Why this exists instead of `new Worker(new URL(...), import.meta.url)`: Turbopack does not compile
// worker entries under `output: 'export'` - it copies the file to static/media verbatim, bare import
// statements and all, so it 404s at runtime. Building them here keeps the app on Turbopack.
//
// Each file is named after a hash of its content (parse.<hash>.js). A page left open across a deploy
// then asks for a file that no longer exists and falls back to running inline, instead of getting
// the new deploy's worker under its old URL, and a CDN can never cache old content under a new name.
// The same hash is baked into the worker as __WORKER_VERSION__ and sent with every reply, so the page
// can also refuse a worker that isn't the one it was built against.
// next.config.js reads the names from .worker-manifest.json.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT_DIR = 'public/workers';
const MANIFEST = '.worker-manifest.json';
const PLACEHOLDER = '__WORKER_VERSION_PLACEHOLDER__';
// Fixed-name builds from before the hashed names; removed so they stop shipping.
const LEGACY = ['public/construction-optimizer.worker.js', 'public/parse.worker.js'];

const WORKERS = [
  { name: 'constructionOptimizer', entry: 'workers/constructionOptimizer.worker.js' },
  {
    name: 'parse',
    entry: 'workers/parse.worker.js',
    // The parsers use the tsconfig path aliases, and utility/helpers pulls in .jsx-syntax .js files.
    options: { tsconfig: 'tsconfig.json', loader: { '.js': 'jsx' }, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } }
  }
];

mkdirSync(OUT_DIR, { recursive: true });
LEGACY.forEach((file) => rmSync(file, { force: true }));

const manifest = {};
for (const { name, entry, options } of WORKERS) {
  const { outputFiles } = await build({
    entryPoints: [entry],
    write: false,
    outfile: `${OUT_DIR}/${name}.js`,
    bundle: true,
    // iife, not esm, so it loads as a classic worker and needs no `{ type: 'module' }` at the call site.
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    ...options,
    define: { ...options?.define, __WORKER_VERSION__: JSON.stringify(PLACEHOLDER) }
  });
  const text = outputFiles[0].text;
  const version = createHash('sha256').update(text).digest('hex').slice(0, 10);
  const file = `${name}.${version}.js`;
  for (const old of readdirSync(OUT_DIR)) {
    if (old.startsWith(`${name}.`) && old !== file) rmSync(`${OUT_DIR}/${old}`);
  }
  writeFileSync(`${OUT_DIR}/${file}`, text.replaceAll(PLACEHOLDER, version));
  manifest[name] = { file, version };
  console.log(`Built ${OUT_DIR}/${file} - ${(text.length / 1024).toFixed(1)} KB`);
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
