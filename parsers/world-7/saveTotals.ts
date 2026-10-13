// Mirrors the leaderboard worker's MongoDB `$sum` over a save array: non-numeric entries are
// skipped and negative placeholders (-1 = locked) are kept, so the page shows the ranked number.
export const sumSaveArray = (values: unknown): number => {
  if (!Array.isArray(values)) return 0;
  return values.reduce((sum: number, value) => sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0), 0);
};
