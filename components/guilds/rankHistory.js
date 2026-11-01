import { isFlat } from '@utility/chartScale';

// A guild's rank points, in a module with no chart in it, so the detail page can read them where its test mocks
// the chart modules.
export function transformRankHistory(rankHistory) {
  if (!rankHistory) return [];
  return rankHistory
    .filter(p => p?.rank != null && p?.captured_at != null)
    .map(p => ({ x: new Date(p.captured_at), y: p.rank, ts: p.captured_at }));
}

const DAY_MS = 24 * 3600 * 1000;

// A rank that never moved is a number, not a chart (Charts board, step 4): the rank, and for how many days.
export const heldRank = (rankHistory) => {
  const points = transformRankHistory(rankHistory);
  if (!isFlat(points.map((point) => point.y))) return null;
  return { rank: points[0].y, days: Math.max(1, Math.round((points.at(-1).ts - points[0].ts) / DAY_MS)) };
};
