// Counters for the You card and the report card header. Holding the max on a maxed board is
// shared with everyone else who has it, so it counts once, as "tied at the max", and never as a
// first place or a top 25 / top 100 finish.
export const countStanding = (ranks, index) => {
  let firsts = 0;
  let top25 = 0;
  let top100 = 0;
  for (const [key, { r, v }] of Object.entries(ranks ?? {})) {
    const meta = index.byKey[key];
    if (meta?.maxed && v >= meta.top) continue;
    if (r === 1 && !meta?.maxed) firsts++;
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

// Boards among `keys` where the player holds the max.
export const countAtMax = (keys, ranks, index) => keys
  .filter((key) => {
    const meta = index.byKey[key];
    return Boolean(meta?.maxed) && ranks?.[key] != null && ranks[key].v >= meta.top;
  }).length;

// Middle rank of the player's boards among `keys`; an even count takes the mean of the two middle ones.
export const medianRank = (keys, ranks) => {
  const sorted = keys.filter((key) => ranks?.[key]).map((key) => ranks[key].r).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

// "top 3.5%" reads as a brag only for the upper half: past 50% it is just noise.
export const TOP_PERCENT_LIMIT = 50;
export const topPercentLabel = (percent) => (Number.isFinite(percent) && percent <= TOP_PERCENT_LIMIT ? `top ${percent}%` : null);
