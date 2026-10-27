// Plain-data snapshot and diff of parsed output, shared by the golden and parse-graph tools.

// Deep copy as JSON-safe data: functions dropped, cycles marked, Map/Set kept as tagged entries,
// non-finite numbers kept as strings so NaN/Infinity survive JSON.
export const clonePlain = (value, ancestors = new Set()) => {
  if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (value === null || typeof value !== 'object') return value;
  if (ancestors.has(value)) return '[cycle]';
  ancestors.add(value);
  let out;
  if (Array.isArray(value)) out = value.map((v) => clonePlain(v, ancestors) ?? null);
  else if (value instanceof Map) out = { __map: [...value].map(([k, v]) => [k, clonePlain(v, ancestors)]) };
  else if (value instanceof Set) out = { __set: [...value].map((v) => clonePlain(v, ancestors)) };
  else {
    out = {};
    for (const key of Object.keys(value).sort()) {
      const v = clonePlain(value[key], ancestors);
      if (v !== undefined) out[key] = v;
    }
  }
  ancestors.delete(value);
  return out;
};

// `account.lab.x` -> `account.lab`, `characters[3].skills.y` -> `characters[].skills`
const sectionOf = (p) => p.replace(/^characters\[\d+\]/, 'characters[]').split('.').slice(0, 2).join('.').replace(/\[\d+\].*$/, '');
const show = (v) => (v !== null && typeof v === 'object' ? JSON.stringify(v).slice(0, 120) : JSON.stringify(v));

export const diffValues = (before, after, maxSamples = 50) => {
  const res = { count: 0, groups: {}, samples: [] };
  const walk = (a, b, p) => {
    if (a === b) return;
    const oa = a !== null && typeof a === 'object';
    const ob = b !== null && typeof b === 'object';
    if (oa && ob && Array.isArray(a) === Array.isArray(b)) {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], Array.isArray(a) ? `${p}[${k}]` : p ? `${p}.${k}` : k);
      return;
    }
    res.count++;
    const g = sectionOf(p);
    res.groups[g] = (res.groups[g] ?? 0) + 1;
    if (res.samples.length < maxSamples) res.samples.push({ path: p, before: show(a), after: show(b) });
  };
  walk(before, after, '');
  return res;
};
