import { useEffect, useRef, useState } from 'react';
import { optimizeArrayWithSwaps } from '@parsers/world-3/constructionOptimizer';
import { prefix } from '@utility/helpers';

const IDLE = { status: 'idle', progress: 0, gain: 0, result: null, error: null };

// Built ahead of the app by utility/build-worker.mjs and served straight out of public/. Turbopack
// does not compile worker entries for a static export, so the usual `new URL(..., import.meta.url)`
// pattern ships an uncompiled file that 404s - see the note in that script.
// The filename never changes, so without the hash a browser keeps running whichever build it cached
// and the results silently come from old code. next.config.js derives it from the built file.
// In dev the file is rebuilt out of band by the dev script, so its hash is whatever was on disk when
// the server booted - stale the moment you edit the optimizer. Per page load is the safe granularity.
const WORKER_VERSION = process.env.NODE_ENV === 'development'
  ? Date.now()
  : (process.env.NEXT_PUBLIC_WORKER_HASH ?? 'dev');
const WORKER_URL = `${prefix}construction-optimizer.worker.js?v=${WORKER_VERSION}`;

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

  const run = (board, options = {}) => {
    const id = ++runIdRef.current;
    workerRef.current?.terminate();
    workerRef.current = null;
    setState({ status: 'running', progress: 0, gain: 0, result: null, error: null });

    // Last resort when there is no usable worker: run inline. The tab freezes for the whole budget,
    // which is exactly what the worker exists to avoid, so this only ever runs after a real failure.
    const runInline = () => {
      if (id !== runIdRef.current) return;
      try {
        const result = optimizeArrayWithSwaps(board, options);
        setState({ status: 'done', progress: 1, gain: 0, result, error: null });
      } catch (error) {
        setState({ ...IDLE, status: 'error', error: error?.message ?? String(error) });
      }
    };

    let worker = null;
    if (typeof Worker !== 'undefined') {
      try {
        worker = new Worker(WORKER_URL);
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
    worker.postMessage({ id, board, options });
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
