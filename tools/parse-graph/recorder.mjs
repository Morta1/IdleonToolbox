// Records which account keys each section reads, and whether a read happens before that key was
// written in the current pass (so it gets the previous pass's value).
const indexLine = () => {
  for (const frame of new Error().stack.split('\n')) {
    const m = frame.match(/parsers[\\/]index\.ts:(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
};

export const createRecorder = () => {
  // Parser call chains run deeper than the default 10 frames; without this, reads from helpers
  // lose their index.ts frame and drop out of the graph.
  Error.stackTraceLimit = 100;
  const reads = {}; // label -> key -> { reads, stale }
  const writes = {}; // key -> Set(line)
  const writeOrder = [];
  const raw = new WeakMap();
  let pass = 0;
  let written = new Set();
  const dynamicKeys = new Set();
  const labels = [];
  let finished = false;

  const label = () => {
    if (finished) return 'after-parse';
    if (labels.length) return labels[labels.length - 1];
    const line = indexLine();
    return line ? `L${line}` : 'unknown';
  };
  const record = (key, stale) => {
    if (typeof key !== 'string') return;
    const byKey = (reads[label()] ??= {});
    const e = (byKey[key] ??= { reads: 0, stale: 0 });
    e.reads++;
    // Pass 1 starts from nothing, so only later passes say anything about ordering.
    if (pass > 0 && (stale ?? (dynamicKeys.has(key) && !written.has(key)))) e.stale++;
  };
  const withLabel = (name, fn) => {
    labels.push(name);
    try { return fn(); } finally { labels.pop(); }
  };
  // Previous-pass data: every read of it is stale by definition.
  const prevTracker = (target, keyOf) =>
    new Proxy(target, {
      get(o, k, r) {
        if (typeof k === 'string') record(keyOf(k), true);
        return Reflect.get(o, k, r);
      },
    });

  const hooks = {
    enter: (name) => labels.push(name),
    exit: () => labels.pop(),
    passStart: (p) => {
      pass = p;
      written = new Set();
      if (p === 1) writeOrder.length = 0;
    },
    passEnd: (p, _pd) => {
      finished = p >= 2;
    },
    wrapAcc: (target) => {
      const proxy = new Proxy(target, {
        get(o, k, r) { record(k); return Reflect.get(o, k, r); },
        has(o, k) { record(k); return Reflect.has(o, k); },
        set(o, k, v) {
          if (typeof k === 'string') {
            written.add(k);
            dynamicKeys.add(k);
            if (pass === 1) writeOrder.push(k);
            (writes[k] ??= new Set()).add(indexLine());
          }
          return Reflect.set(o, k, v);
        },
      });
      raw.set(proxy, target);
      return proxy;
    },
    unwrap: (proxy) => raw.get(proxy) ?? proxy,
    // initializeCharacter gets a copy of the account: reads through it belong to "characters", and
    // are stale when the key had not been written yet at the moment of the copy.
    copyAcc: (proxy) => {
      const writtenAtCopy = new Set(written);
      const copy = { ...(raw.get(proxy) ?? proxy) };
      return new Proxy(copy, {
        get(o, k, r) {
          if (typeof k === 'string') withLabel('characters', () => record(k, dynamicKeys.has(k) && !writtenAtCopy.has(k)));
          return Reflect.get(o, k, r);
        },
      });
    },
    wrapChars: (chars) => prevTracker(chars, () => 'characters'),
    wrapPrev: (pd) =>
      pd &&
      new Proxy(pd, {
        get(o, k, r) {
          const v = Reflect.get(o, k, r);
          if (k === 'charactersData' && Array.isArray(v)) return prevTracker(v, () => 'characters');
          if (k === 'accountData' && v) return prevTracker(v, (key) => key);
          return v;
        },
      }),
  };

  // Paths in the parse result that still point at the live account proxy (result objects holding
  // `account`): these break structuredClone into a worker.
  const findHolders = (result) => {
    const found = [];
    const seen = new WeakSet();
    const walk = (v, p, depth) => {
      if (v === null || typeof v !== 'object' || depth > 12) return;
      if (raw.has(v)) return void found.push(p);
      if (seen.has(v)) return;
      seen.add(v);
      for (const k of Object.keys(v)) walk(v[k], Array.isArray(v) ? `${p}[]` : `${p}.${k}`, depth + 1);
    };
    walk(result.account, 'account', 0);
    walk(result.characters, 'characters', 0);
    return [...new Set(found)];
  };

  const merge = (into = { reads: {}, writes: {}, writeOrder: [] }) => {
    for (const [l, keys] of Object.entries(reads)) {
      for (const [k, e] of Object.entries(keys)) {
        const t = ((into.reads[l] ??= {})[k] ??= { reads: 0, stale: 0 });
        t.reads += e.reads;
        t.stale += e.stale;
      }
    }
    for (const [k, lines] of Object.entries(writes)) into.writes[k] = [...new Set([...(into.writes[k] ?? []), ...lines])];
    if (!into.writeOrder.length) into.writeOrder = [...writeOrder];
    return into;
  };

  return { hooks, merge, findHolders };
};
