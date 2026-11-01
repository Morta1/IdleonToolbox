// A guild's rank points, in a module with no chart in it, so the detail page can read them where its test mocks
// the chart modules.
export function transformRankHistory(rankHistory) {
  if (!rankHistory) return [];
  return rankHistory
    .filter(p => p?.rank != null && p?.captured_at != null)
    .map(p => ({ x: new Date(p.captured_at), y: p.rank, ts: p.captured_at }));
}
