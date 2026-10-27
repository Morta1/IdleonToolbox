import { attachZeroIndexArrays } from '@parsers/zeroIndexArray';
import { workerFile } from '@utility/workerFile';
import { trackEvent } from '@utility/analytics';

const WORKER = workerFile('parse');

let worker;
let nextId = 0;
const pending = new Map();

const parseOnMainThread = async (args) => {
  const { parseData } = await import('@parsers/index');
  return parseData(...args);
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
  if (typeof Worker === 'undefined' || !WORKER) return (worker = null);
  try {
    worker = new Worker(WORKER.url);
  } catch {
    return (worker = null);
  }
  worker.onmessage = ({ data }) => {
    // A worker from another build (a stale cache, a half-finished deploy) can't be trusted with
    // this page's parse, even if its reply looks fine.
    if (data?.version !== WORKER.version) return dropWorker({ message: `worker version ${data?.version}, page expects ${WORKER.version}` });
    const job = pending.get(data?.id);
    if (!job) return;
    pending.delete(data.id);
    if (data.error) {
      reportFallback(data.error);
      job.fallback();
    } else {
      attachZeroIndexArrays(data.result, data.zeroIndexPaths);
      job.resolve(data.result);
    }
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
