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
// The history keeps one point a day for 30 days. A rank held across a full window spans 29 days between its first
// and last point, and may have held longer: it reads as the whole window (the label says 30+), so it does not
// flip between 29 and 30 during the day.
const RANK_WINDOW = 30;

// A rank that never moved is a number, not a chart (Charts board, step 4): the rank, and for how many days.
export const heldRank = (rankHistory) => {
  const points = transformRankHistory(rankHistory);
  if (!isFlat(points.map((point) => point.y))) return null;
  const days = points.length >= RANK_WINDOW ? RANK_WINDOW : Math.max(1, Math.round((points.at(-1).ts - points[0].ts) / DAY_MS));
  return { rank: points[0].y, days };
};
