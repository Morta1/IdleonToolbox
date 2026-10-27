// Parses saves off the main thread. An endgame save takes around a second, which froze the page on
// every cloud update and companion toggle. Bundled into public/ by utility/build-worker.mjs.
// The parsers rely on the prototype helpers _app installs (toSimpleObject and friends).
import '../polyfills';
import { parseData } from '../parsers/index';
import { detachZeroIndexArrays } from '../parsers/zeroIndexArray';

// The first path in the result that the browser refuses to structured-clone, so a parser that starts
// returning something uncloneable is named in the console instead of only failing over.
// A MessagePort, not structuredClone: the polyfills swap in core-js's structuredClone, which accepts
// values the browser's postMessage rejects.
const probe = new MessageChannel().port1;
const findUncloneable = (value, path = 'result', depth = 0) => {
  try {
    probe.postMessage(value);
    return null;
  } catch {
    if (value === null || typeof value !== 'object' || depth > 20) return path;
    for (const key of Object.keys(value)) {
      const found = findUncloneable(value[key], Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`, depth + 1);
      if (found) return found;
    }
    return path;
  }
};

self.onmessage = ({ data }) => {
  const { id, args } = data || {};
  let result;
  try {
    result = parseData(...args);
    const zeroIndexPaths = detachZeroIndexArrays(result);
    self.postMessage({ id, version: __WORKER_VERSION__, result, zeroIndexPaths });
  } catch (error) {
    const where = result ? ` at ${findUncloneable(result)}` : '';
    self.postMessage({ id, version: __WORKER_VERSION__, error: `${error?.message ?? String(error)}${where}` });
  }
};
