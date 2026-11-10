import { getTomeRankIndex, TOME_RANKS } from '@parsers/world-4/tome';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'tomeRank',
  label: 'Tome rank',
  entryLabel: 'rank',
  scope: 'account',
  // one entry: the goal form picks it itself
  single: true,
  route: GOAL_ROUTES.tomeRank,
  list: ({ account }) => (account?.tome ? [account.tome] : []),
  key: () => 'rank',
  name: () => 'Tome rank',
  icon: () => 'etc/Tome_0',
  metrics: {
    // one tier per cut-off the page lists, worst first; the cut-offs come from the server so the goal follows them
    rank: {
      label: 'Rank',
      noun: 'rank',
      value: (row) => {
        const index = getTomeRankIndex(row);
        return index >= 0 ? TOME_RANKS.length - index : 0;
      },
      tiers: ['None', ...TOME_RANKS.toReversed().map((rank) => `Top ${rank}`)],
      // the bar follows total points toward the target tier's cut-off
      tierAmount: {
        have: (row) => row.totalPoints ?? 0,
        need: (row, tier) => row.tops?.[TOME_RANKS.length - tier]
      }
    }
  }
};
