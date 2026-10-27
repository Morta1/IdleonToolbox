import { useEffect, useRef, useState } from 'react';
import { optimizeArrayWithSwaps, optimizeSwapCurve } from '@parsers/world-3/constructionOptimizer';
import { workerFile } from '@utility/workerFile';

const IDLE = { status: 'idle', progress: 0, gain: 0, result: null, error: null };

// Built ahead of the app by utility/build-worker.mjs into public/workers/ under a content-hashed name.
// Turbopack does not compile worker entries for a static export, so the usual
// `new URL(..., import.meta.url)` pattern ships an uncompiled file that 404s - see that script.
// The dev script builds it once at startup: restart dev after editing the optimizer.
const WORKER = workerFile('constructionOptimizer');

/**
 * Runs the board optimizer in a Web Worker so the page keeps responding, and reports how far along
 * it is. Cancelling terminates the worker outright - the search has no natural yield point, and the
 * partial result is not worth keeping.
 */
export const useConstructionOptimizer = () => {
  const workerRef = useRef(null);
  const runIdRef = useRef(0);
  const [state, setState] = useState(IDLE);

  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const run = (board, options = {}, mode) => {
    const id = ++runIdRef.current;
    workerRef.current?.terminate();
    workerRef.current = null;
    setState({ status: 'running', progress: 0, gain: 0, result: null, error: null });

    // Last resort when there is no usable worker: run inline. The tab freezes for the whole budget,
    // which is exactly what the worker exists to avoid, so this only ever runs after a real failure.
    const runInline = () => {
      if (id !== runIdRef.current) return;
      try {
        const result = (mode === 'curve' ? optimizeSwapCurve : optimizeArrayWithSwaps)(board, options);
        setState({ status: 'done', progress: 1, gain: 0, result, error: null });
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
    worker.onmessage = ({ data }) => {
      if (data?.id !== runIdRef.current) return;
      // A worker from another build can't be trusted with this page's board.
      if (data.version !== WORKER.version) {
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        runInline();
        return;
      }
      if (data.type === 'progress') {
        const { elapsed, budget, gain } = data.progress;
        setState((previous) => ({
          ...previous,
          progress: budget > 0 ? Math.min(1, elapsed / budget) : 1,
          gain
        }));
      } else if (data.type === 'done') {
        setState({ status: 'done', progress: 1, gain: 0, result: data.result, error: null });
        worker.terminate();
        workerRef.current = null;
      } else if (data.type === 'error') {
        setState({ ...IDLE, status: 'error', error: data.message });
        worker.terminate();
        workerRef.current = null;
      }
    };
    // A worker that fails to load at all (bundler shipped it unbundled, CSP, file:// origin) never
    // sends a message - onerror is the only signal, so fall back to inline rather than dead-ending.
    worker.onerror = () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      runInline();
    };
    worker.postMessage({ id, board, options, mode });
  };

  const cancel = () => {
    runIdRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    setState(IDLE);
  };

  const reset = () => {
    runIdRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    setState(IDLE);
  };

  return { ...state, run, cancel, reset };
};
