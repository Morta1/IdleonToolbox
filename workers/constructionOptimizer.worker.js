// Runs the construction optimizer off the main thread. The search burns the whole compute budget in
// a tight loop, so on the main thread it would freeze the tab for the full duration.
// Imports the leaf optimizer module on purpose - pulling in the full construction parser would drag
// the data/website-data/ directory (~7.7MB on disk, e.g. monsterDrops.json alone at ~2MB) into this bundle.
import { optimizeArrayWithSwaps, optimizeSwapCurve } from '../parsers/world-3/constructionOptimizer';

self.onmessage = ({ data }) => {
  const { id, board, options, mode } = data || {};
  try {
    // A curve run is several searches sharing one time budget, so it reports progress the same way a
    // single one does and the caller cannot tell the difference.
    const optimize = mode === 'curve' ? optimizeSwapCurve : optimizeArrayWithSwaps;
    const result = optimize(board, {
      ...options,
      onProgress: (progress) => self.postMessage({ id, type: 'progress', progress })
    });
    self.postMessage({ id, type: 'done', result });
  } catch (error) {
    self.postMessage({ id, type: 'error', message: error?.message ?? String(error) });
  }
};
