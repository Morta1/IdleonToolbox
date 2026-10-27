import { prefix } from '@utility/helpers';
import { attachZeroIndexArrays } from '@parsers/zeroIndexArray';

// Same cache-busting scheme as the construction optimizer worker (see useConstructionOptimizer.js):
// the file name never changes, so the URL carries a hash of the built file.
const WORKER_VERSION = process.env.NODE_ENV === 'development'
  ? Date.now()
  : (process.env.NEXT_PUBLIC_PARSE_WORKER_HASH ?? 'dev');
const WORKER_URL = `${prefix}parse.worker.js?v=${WORKER_VERSION}`;

let worker;
let nextId = 0;
const pending = new Map();

const parseOnMainThread = async (args) => {
  const { parseData } = await import('@parsers/index');
  return parseData(...args);
};

// Logged loudly: the fallback keeps the page working, which is exactly what hides a broken worker.
const reportFallback = (reason) => console.error('[parseSave] parsing on the main thread:', reason);

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
  if (typeof Worker === 'undefined') return (worker = null);
  try {
    worker = new Worker(WORKER_URL);
  } catch {
    return (worker = null);
  }
  worker.onmessage = ({ data }) => {
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
