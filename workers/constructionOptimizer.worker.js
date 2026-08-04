// Runs the construction optimizer off the main thread. The search burns the whole compute budget in
// a tight loop, so on the main thread it would freeze the tab for the full duration.
// Imports the leaf optimizer module on purpose - pulling in the full construction parser would drag
// the 9MB website-data.json into this bundle.
import { optimizeArrayWithSwaps } from '../parsers/world-3/constructionOptimizer';

self.onmessage = ({ data }) => {
  const { id, board, options } = data || {};
  try {
    const result = optimizeArrayWithSwaps(board, {
      ...options,
      onProgress: (progress) => self.postMessage({ id, type: 'progress', progress })
    });
    self.postMessage({ id, type: 'done', result });
  } catch (error) {
    self.postMessage({ id, type: 'error', message: error?.message ?? String(error) });
  }
};
