import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'components'),
      '@parsers': path.resolve(__dirname, 'parsers'),
      '@utility': path.resolve(__dirname, 'utility'),
      '@hooks': path.resolve(__dirname, 'hooks'),
      '@website-data': path.resolve(__dirname, 'data/website-data.json'),
    },
  },
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
