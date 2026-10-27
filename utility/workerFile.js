import { prefix } from '@utility/helpers';

// Built by utility/build-worker.mjs, passed in by next.config.js as { name: { file, version } }.
const workers = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_WORKERS || '{}');
  } catch {
    return {};
  }
})();

/** URL and expected version of a prebuilt worker, or null when it wasn't built (tests). */
export const workerFile = (name) => {
  const worker = workers[name];
  return worker ? { url: `${prefix}workers/${worker.file}`, version: worker.version } : null;
};
