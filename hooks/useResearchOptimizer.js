import { useEffect, useRef, useState } from 'react';
import { optimizeLenses, optimizeShapes } from '@parsers/world-7/researchOptimizer';
import { workerFile } from '@utility/workerFile';

const IDLE = { status: 'idle', progress: 0, result: null, error: null };

// Built ahead of the app by utility/build-worker.mjs into public/workers/, as the Construction optimizer's is.
const WORKER = workerFile('researchOptimizer');

const runOptimizer = (mode, input, options) => (mode === 'lenses' ? optimizeLenses : optimizeShapes)(input, options);

// Same defaults the searches use, so callers that leave an option out share a cache entry with ones that pass it
const withDefaults = (mode, options) => (mode === 'lenses' ? { realHours: 0, keepMonocles: false, ...options } : options);

/**
 * The key for one search: every input field the search reads plus its options. Components use it as their effect
 * dependency too, so any change to the save reruns the search. The shape catalog is fixed per build.
 */
export const getOptimizerKey = (mode, input, options = {}) => JSON.stringify([mode, withDefaults(mode, options),
  { ...input, shapeCatalog: undefined }]);

// Finished results by key, for this page load only: going to another page and back reuses them, a reload doesn't.
// Results are shared, so callers must never change them.
const CACHE_SIZE = 12;
const cache = new Map();
const remember = (key, result) => {
  cache.delete(key);
  cache.set(key, result);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
};

/**
 * Runs the Research optimizer (mode 'shapes' or 'lenses') in a Web Worker and reports how far along it is.
 * A new run or cancel terminates the one before. Without a usable worker it runs inline, which freezes the tab
 * for the search's few seconds, so that only happens after a real failure.
 */
export const useResearchOptimizer = () => {
  const workerRef = useRef(null);
  const runIdRef = useRef(0);
  const [state, setState] = useState(IDLE);

  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const stop = () => {
    runIdRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
  };

  const run = (mode, input, rawOptions = {}) => {
    stop();
    const id = runIdRef.current;
    const options = withDefaults(mode, rawOptions);
    const key = getOptimizerKey(mode, input, options);
    if (cache.has(key)) {
      const result = cache.get(key);
      remember(key, result);
      setState({ status: 'done', progress: 1, result, error: null });
      return;
    }
    setState({ ...IDLE, status: 'running' });

    const runInline = () => {
      if (id !== runIdRef.current) return;
      try {
        const result = runOptimizer(mode, input, options);
        remember(key, result);
        setState({ status: 'done', progress: 1, result, error: null });
      } catch (error) {
        setState({ ...IDLE, status: 'error', error: error?.message ?? String(error) });
      }
    };

    let worker = null;
    if (typeof Worker !== 'undefined' && WORKER) {
      try {
        worker = new Worker(WORKER.url);
      } catch {
        worker = null;
      }
    }
    if (!worker) {
      runInline();
      return;
    }

    workerRef.current = worker;
    const finish = () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    worker.onmessage = ({ data }) => {
      if (data?.id !== runIdRef.current) return;
      // A worker from another build can't be trusted with this page's input.
      if (data.version !== WORKER.version) {
        finish();
        runInline();
      } else if (data.type === 'progress') {
        setState((previous) => ({ ...previous, progress: Math.min(1, data.progress) }));
      } else if (data.type === 'done') {
        remember(key, data.result);
        setState({ status: 'done', progress: 1, result: data.result, error: null });
        finish();
      } else if (data.type === 'error') {
        setState({ ...IDLE, status: 'error', error: data.message });
        finish();
      }
    };
    // A worker that fails to load never sends a message: fall back to inline rather than dead-ending.
    worker.onerror = () => {
      finish();
      runInline();
    };
    worker.postMessage({ id, mode, input, options });
  };

  const cancel = () => {
    stop();
    setState(IDLE);
  };

  return { ...state, run, cancel };
};
