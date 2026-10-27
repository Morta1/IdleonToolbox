const { existsSync, readFileSync } = require('node:fs');

// The Web Workers are prebuilt into public/workers/ under content-hashed names (see
// utility/build-worker.mjs), which writes their names to the manifest. Both `dev` and `prebuild` run
// that script first, so the manifest is already on disk by the time this is read.
const WORKER_MANIFEST = '.worker-manifest.json';
const workers = existsSync(WORKER_MANIFEST) ? readFileSync(WORKER_MANIFEST, 'utf8') : '{}';

module.exports = {
  reactStrictMode: false,
  assetPrefix: '/',
  output: 'export',
  reactCompiler: true,
  // The build's type check reports errors only in .ts/.tsx (no checkJs), but tsconfig.json's
  // include pulls every .js/.jsx into the program for the editor - 3,200 files instead of 1,600,
  // and roughly 4x the check time. The build config checks the same files the errors come from.
  typescript: {
    tsconfigPath: 'tsconfig.build.json'
  },
  // Turbopack bundles MUI with emotion's ESM build but leaves _app/_document on the external CJS
  // build, so the server ran two emotion instances. MUI never saw _app's CacheProvider: every
  // page inlined its CSS into <body> (some blocks twice) and _document's extraction came back
  // empty. Bundling emotion puts everything on one instance. vercel/next.js#95834, #91411.
  transpilePackages: ['@emotion/react', '@emotion/styled', '@emotion/cache', '@emotion/server'],
  env: {
    NEXT_PUBLIC_WORKERS: JSON.stringify(JSON.parse(workers))
  },
  images: {
    unoptimized: true,
  },
  // Task worktrees live under the main checkout and junction its node_modules. Turbopack refuses
  // files outside its root, so the worktree's dev server points the root at the main checkout.
  ...(process.env.TURBOPACK_ROOT && { turbopack: { root: process.env.TURBOPACK_ROOT } }),
  // The deploy sets NEXT_BUILD_CPUS to render static pages on every core of its runner.
  ...(process.env.NEXT_BUILD_CPUS && { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } }),
};
