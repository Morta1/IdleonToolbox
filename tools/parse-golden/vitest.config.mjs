import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Standalone config so the golden run never joins the main suite (which only globs __test__/).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const r = (p) => path.resolve(ROOT, p);

export default {
  root: ROOT,
  resolve: {
    alias: [
      { find: '@components', replacement: r('components') },
      { find: '@parsers', replacement: r('parsers') },
      { find: '@utility', replacement: r('utility') },
      { find: '@hooks', replacement: r('hooks') },
      { find: '@website-data', replacement: r('data/website-data/index.js') },
      ...['components', 'parsers', 'utility', 'hooks', 'services', 'data'].map((p) => ({ find: new RegExp(`^${p}/`), replacement: `${r(p)}/` })),
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tools/parse-golden/golden.test.mjs'],
    testTimeout: 600000,
    hookTimeout: 600000,
  },
};
