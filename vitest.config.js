import { defineConfig } from 'vitest/config';
import path from 'path';

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
    include: ['__test__/**/*.test.{js,ts,jsx,tsx}'],
    exclude: ['e2e/**'],
    isolate: false,
  },
});
