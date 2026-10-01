import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

// Files opt into jsdom with a docblock, so the split has to read them rather than match a path.
const testGlob = '__test__/**/*.test.{js,ts,jsx,tsx}';
const jsdomTests = fs.globSync(testGlob, { cwd: __dirname })
  .map((file) => file.replaceAll('\\', '/'))
  .filter((file) => /@vitest-environment\s+jsdom/.test(fs.readFileSync(path.join(__dirname, file), 'utf8')));

export default defineConfig({
  resolve: {
    // Mirrors tsconfig.json's baseUrl: "./", which lets Next resolve bare root-relative imports
    // like 'services/builds'. Vite doesn't read baseUrl, so each prefix needs an entry. Anchored
    // regexes rather than plain strings: a string alias of 'data' would also rewrite any
    // specifier merely starting with those characters.
    alias: [
      { find: '@components', replacement: path.resolve(__dirname, 'components') },
      { find: '@parsers', replacement: path.resolve(__dirname, 'parsers') },
      { find: '@utility', replacement: path.resolve(__dirname, 'utility') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'hooks') },
      { find: '@website-data', replacement: path.resolve(__dirname, 'data/website-data/index.js') },
      { find: /^components\//, replacement: `${path.resolve(__dirname, 'components')}/` },
      { find: /^parsers\//, replacement: `${path.resolve(__dirname, 'parsers')}/` },
      { find: /^utility\//, replacement: `${path.resolve(__dirname, 'utility')}/` },
      { find: /^hooks\//, replacement: `${path.resolve(__dirname, 'hooks')}/` },
      { find: /^services\//, replacement: `${path.resolve(__dirname, 'services')}/` },
    ],
  },
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__test__/vitest.setup.js'],
    isolate: false,
    // Parser tests parse the full ~4MB website-data fixtures, and with isolate:false they all
    // share one environment under parallel load. Several sit near a second on their own and
    // were intermittently blowing the 5s default, failing a different file on every run. The
    // timeout is here to catch a genuine hang, which 20s still does.
    testTimeout: 20000,
    // isolate:false shares every loaded module across the files a worker runs, but each jsdom file
    // gets a fresh document. testing-library's `screen`, emotion's style cache and any module a
    // vi.mock should have replaced all stayed bound to the first file's document or imports, so
    // which component test failed depended on how files landed on workers. The jsdom files are
    // cheap to load and gain nothing from sharing, so they get their own pool with a fresh worker
    // per file. It has to be a separate pool: forks takes `isolate` from the root config only, and
    // a per-project `isolate` resets vite's module cache but not the node_modules those live in.
    poolOptions: { threads: { isolate: true } },
    projects: [
      { extends: true, test: { name: 'node', include: [testGlob], exclude: jsdomTests } },
      { extends: true, test: { name: 'jsdom', include: jsdomTests, pool: 'threads' } },
    ],
  },
});
