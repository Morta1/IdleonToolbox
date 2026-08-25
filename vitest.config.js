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
    // Parser tests parse the full ~4MB website-data fixtures, and with isolate:false they all
    // share one environment under parallel load. Several sit near a second on their own and
    // were intermittently blowing the 5s default, failing a different file on every run. The
    // timeout is here to catch a genuine hang, which 20s still does.
    testTimeout: 20000,
  },
});
