import base from '../../vitest.config.js';

// Same aliases as the main suite; only the test set differs, so the golden run never joins it.
export default {
  ...base,
  test: {
    globals: true,
    environment: 'node',
    include: ['tools/parse-golden/golden.test.mjs'],
    testTimeout: 600000,
    hookTimeout: 600000,
  },
};
