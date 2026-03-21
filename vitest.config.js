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
    environment: 'jsdom',
    include: ['__test__/**/*.test.{js,ts,jsx,tsx}'],
    exclude: ['e2e/**'],
  },
});
