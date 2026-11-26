import { useEffect, useRef, useState } from 'react';
import { optimizeLenses, optimizeShapes } from '@parsers/world-7/researchOptimizer';
import { workerFile } from '@utility/workerFile';

const IDLE = { status: 'idle', progress: 0, result: null, error: null };

// Built ahead of the app by utility/build-worker.mjs into public/workers/, as the Construction optimizer's is.
const WORKER = workerFile('researchOptimizer');

const runOptimizer = (mode, input, options) => (mode === 'lenses' ? optimizeLenses : optimizeShapes)(input, options);

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

  const run = (mode, input, options = {}) => {
    stop();
    const id = runIdRef.current;
    setState({ ...IDLE, status: 'running' });

    const runInline = () => {
      if (id !== runIdRef.current) return;
      try {
        setState({ status: 'done', progress: 1, result: runOptimizer(mode, input, options), error: null });
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
