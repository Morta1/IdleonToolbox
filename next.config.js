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
  env: {
    NEXT_PUBLIC_WORKER_HASH: workerHash
  },
  images: {
    unoptimized: true,
  },
};
