import { attachZeroIndexArrays } from '@parsers/zeroIndexArray';
import { workerFile } from '@utility/workerFile';
import { trackEvent } from '@utility/analytics';

const WORKER = workerFile('parse');

let worker;
let nextId = 0;
const pending = new Map();

// parseData reports its own failures to GA through window.gtag, which a worker doesn't have, so a
// worker's failed parse is reported here. Either way the flag never reaches app state.
const settle = (result, fromWorker) => {
  if (result?.parseFailed) {
    if (fromWorker) trackEvent('error', { event_category: 'error', event_label: 'parse', value: 1 });
    delete result.parseFailed;
  }
  return result;
};

const parseOnMainThread = async (args) => {
  const { parseData } = await import('@parsers/index');
  return settle(parseData(...args), false);
};

// Logged loudly and sent to GA: the fallback keeps the page working, which is exactly what hides a
// broken worker in the field.
const reportFallback = (reason) => {
  console.error('[parseSave] parsing on the main thread:', reason);
  trackEvent('parse_worker_fallback', { reason: String(reason).slice(0, 100) });
};

// Anything that stops the worker (no Worker support, a failed load during a deploy, a result that
// can't be posted back) falls back to parsing here, so a save always loads.
const dropWorker = (event) => {
  reportFallback(event?.message ?? event?.type ?? 'worker failed');
  worker?.terminate();
  worker = null;
  const waiting = [...pending.values()];
  pending.clear();
  waiting.forEach((job) => job.fallback());
};

const getWorker = () => {
  if (worker !== undefined) return worker;
  // The dev script builds the worker once at startup, so in dev it would keep parsing with the
  // parsers as they were then. Parse here instead, so parser edits show on the next load.
  if (typeof Worker === 'undefined' || process.env.NODE_ENV === 'development') return (worker = null);
  // A browser that has workers but a build that didn't name one: still parse, but say so.
  if (!WORKER) {
    reportFallback('no parse worker in this build');
    return (worker = null);
  }
  try {
    worker = new Worker(WORKER.url);
  } catch {
    return (worker = null);
  }
  worker.onmessage = ({ data }) => {
    // A worker from another build (a stale cache, a half-finished deploy) can't be trusted with
    // this page's parse, even if its reply looks fine.
    if (data?.version !== WORKER.version) return dropWorker({ message: `worker version ${data?.version}, page expects ${WORKER.version}` });
    // A result the worker couldn't post would fail the same way next time, and falling back only this
    // job could let newer worker results land before it: drop the worker, all jobs in order.
    if (data?.error) return dropWorker({ message: data.error });
    const job = pending.get(data?.id);
    if (!job) return;
    pending.delete(data.id);
    attachZeroIndexArrays(data.result, data.zeroIndexPaths);
    job.resolve(settle(data.result, true));
  };
  worker.onerror = dropWorker;
  worker.onmessageerror = dropWorker;
  return worker;
};

/** `parseData` in a Web Worker: same arguments, same `{ account, characters }`, as a promise. */
export const parseSave = (...args) => {
  const w = getWorker();
  if (!w) return parseOnMainThread(args);
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, fallback: () => parseOnMainThread(args).then(resolve, reject) });
    try {
      w.postMessage({ id, args });
    } catch (error) {
      reportFallback(error?.message);
      pending.delete(id);
      parseOnMainThread(args).then(resolve, reject);
    }
  });
};
