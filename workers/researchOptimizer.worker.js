// Runs the Research optimizer off the main thread: a full shape search takes a few seconds on a late account.
// Imports the leaf optimizer module only, so the bundle carries no parsers or website data.
import { optimizeLenses, optimizeShapes } from '../parsers/world-7/researchOptimizer';

self.onmessage = ({ data }) => {
  const { id, mode, input, options } = data || {};
  try {
    const onProgress = (progress) => self.postMessage({ id, version: __WORKER_VERSION__, type: 'progress', progress });
    const result = mode === 'lenses' ? optimizeLenses(input, options) : optimizeShapes(input, { ...options, onProgress });
    self.postMessage({ id, version: __WORKER_VERSION__, type: 'done', result });
  } catch (error) {
    self.postMessage({ id, version: __WORKER_VERSION__, type: 'error', message: error?.message ?? String(error) });
  }
};
