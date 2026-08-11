import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@components', replacement: path.resolve(__dirname, 'components') },
      { find: '@parsers', replacement: path.resolve(__dirname, 'parsers') },
      { find: '@utility', replacement: path.resolve(__dirname, 'utility') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'hooks') },
      { find: '@website-data', replacement: path.resolve(__dirname, 'data/website-data.json') },
      // Some components import root-relative ('utility/helpers'), which Next resolves via its own
      // module directories. Vite has no equivalent, so mirror the same roots here or those files
      // cannot be imported by a test at all.
      { find: /^components\//, replacement: `${path.resolve(__dirname, 'components')}/` },
      { find: /^parsers\//, replacement: `${path.resolve(__dirname, 'parsers')}/` },
      { find: /^utility\//, replacement: `${path.resolve(__dirname, 'utility')}/` },
      { find: /^hooks\//, replacement: `${path.resolve(__dirname, 'hooks')}/` },
    ],
  },
  // Components rely on the automatic JSX runtime (Next's default) - most do not import React at
  // all, so without this any test that renders one fails with "React is not defined".
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    // Parser/utility tests are pure - none of them touch document/window. jsdom was being stood up
    // for all 40 files anyway, which was ~26s of a 30s run. Files that genuinely need a DOM opt in
    // with a `// @vitest-environment jsdom` docblock (currently only __test__/hooks/).
    environment: 'node',
    include: ['__test__/**/*.test.{js,ts,jsx,tsx}'],
    exclude: ['e2e/**'],
    // Module loading (`collect`) dominates the run: data/website-data.json plus the five fixture
    // saves are megabytes of JSON, and with isolation on, every one of the 40 test files re-parsed
    // them in a fresh module registry. Files here are read-only against that data and hold no
    // cross-file mutable state, so sharing one registry per worker is safe.
    isolate: false,
  },
});
