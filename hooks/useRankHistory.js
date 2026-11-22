import { useQuery } from '@tanstack/react-query';
import { fetchBoardHistory, fetchHistory } from '../services/leaderboards';

// What moved between a past standing of the player (the history route's snapshot) and their standing now (the /player
// reply): the global rank, points, and each board both ranked. Positive is up. Null with nothing to compare with.
// A past board entry is [rank, value, tied, at the max].
export const historyChanges = (data, history) => {
  const past = history?.snapshot;
  if (!past || !data?.player) return null;
  const boards = Object.entries(data.ranks ?? {})
    .filter(([metric, { r }]) => past.ranks[metric] != null && past.ranks[metric][0] !== r)
    .map(([metric, { r, v }]) => {
      const [from, valueFrom] = past.ranks[metric];
      return { metric, from, to: r, delta: from - r, valueFrom, valueTo: v };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.to - b.to);
  return {
    since: past.at,
    range: history.range ?? null,
    rank: past.rank - data.player.rank,
    // Points are a sum over every board, so they only compare between standings with the same number of boards.
    pointsFrom: history.boardsNow != null && past.boards === history.boardsNow ? past.points : null,
    boards,
    past: past.ranks
  };
};

const FIVE_MINUTES = 5 * 60 * 1000;

// The signed-in player's own history only (never a searched player's). range: 7, 30 or 90 days back, or null for the
// default view, the player's latest standing recorded at least 12 hours before their newest one.
const useRankHistory = (name, range = null) => useQuery({
  queryKey: ['lb-history', name, range],
  queryFn: () => fetchHistory(name, range),
  enabled: Boolean(name),
  staleTime: FIVE_MINUTES
});

// The same player's line on one board, for the chart in the opened board.
export const useBoardHistory = (name, metric) => useQuery({
  queryKey: ['lb-history-board', name, metric],
  queryFn: () => fetchBoardHistory(name, metric),
  enabled: Boolean(name && metric),
  staleTime: FIVE_MINUTES
});

export default useRankHistory;
