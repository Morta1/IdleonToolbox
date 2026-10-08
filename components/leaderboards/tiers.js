import { formatMetricValue } from './format';

// Reaching the next tie group's value ties it, and under competition ranking that is its rank:
// hence "reach", not "pass". Past 1e6 a difference is unreadable, a ratio is not, but only once
// the ratio is well above 1: a near-tie rounds to "×1" and hides the gap, which the difference shows.
export const nextRankText = (entry, meta) => {
  if (!entry) return null;
  const atMax = Boolean(meta?.maxed) && entry.v >= meta.top;
  if (entry.r === 1) return atMax ? 'Maxed' : entry.t > 1 ? 'Tied leader' : 'Leader';
  if (entry.nv == null) return null;
  if (entry.v >= 1e6 && entry.nv / entry.v >= 1.1) return `×${Number((entry.nv / entry.v).toPrecision(2))} to reach #${entry.nr}`;
  return `+${formatMetricValue(meta?.notation, entry.nv - entry.v)} to reach #${entry.nr}`;
};
