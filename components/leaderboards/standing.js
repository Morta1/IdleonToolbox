// Counters for the You card and the report card header. A maxed board is not a first place: most
// of its players share #1.
export const countStanding = (ranks, index) => {
  let firsts = 0;
  let top25 = 0;
  let top100 = 0;
  for (const [key, { r }] of Object.entries(ranks ?? {})) {
    if (r === 1 && !index.byKey[key]?.maxed) firsts++;
    if (r <= 25) top25++;
    if (r <= 100) top100++;
  }
  return { firsts, top25, top100 };
};

// Smallest relative step to the next rank. Leaders and maxed boards have nothing left to reach.
export const withinReach = (ranks, index, count = 3) => Object.entries(ranks ?? {})
  .filter(([key, entry]) => entry.nv != null && entry.v > 0 && !index.byKey[key]?.maxed)
  .map(([key, entry]) => ({ key, ...entry, gap: (entry.nv - entry.v) / entry.v }))
  .sort((a, b) => a.gap - b.gap || a.r - b.r)
  .slice(0, count);

export const bestInSection = (keys, ranks) => keys
  .filter((key) => ranks?.[key])
  .map((key) => ({ key, ...ranks[key] }))
  .sort((a, b) => a.p - b.p || a.r - b.r)[0] ?? null;
