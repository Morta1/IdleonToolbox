const { createHash } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');

// The optimizer worker is prebuilt into public/ under a fixed name (see utility/build-worker.mjs),
// so nothing in the URL changes when its contents do and a browser will happily keep running the
// version it cached. Hashing it here gives the hook a cache buster. Both `dev` and `prebuild` run
// the build script first, so the file is already on disk by the time this is read.
const WORKER_FILE = 'public/construction-optimizer.worker.js';
const workerHash = existsSync(WORKER_FILE)
  ? createHash('sha256').update(readFileSync(WORKER_FILE)).digest('hex').slice(0, 8)
  : 'missing';

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
    NEXT_PUBLIC_WORKER_HASH: workerHash
  },
  images: {
    unoptimized: true,
  },
};
