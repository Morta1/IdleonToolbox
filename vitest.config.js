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
      { find: /^components\//, replacement: `${path.resolve(__dirname, 'components')}/` },
      { find: /^parsers\//, replacement: `${path.resolve(__dirname, 'parsers')}/` },
      { find: /^utility\//, replacement: `${path.resolve(__dirname, 'utility')}/` },
      { find: /^hooks\//, replacement: `${path.resolve(__dirname, 'hooks')}/` },
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
