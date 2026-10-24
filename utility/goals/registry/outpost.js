import { OUTPOST_RANK_NAMES } from '@parsers/class-specific/royalGuardian';
import { GOAL_ROUTES } from '../routes';

// One metric per rank bar the outposts page shows on each card
const rankMetrics = Object.fromEntries(OUTPOST_RANK_NAMES.map((rankName, type) => [
  `rank${type}`,
  { label: `${rankName} rank`, noun: 'rank', value: (row) => row.rankBars?.[type]?.rank ?? 0 }
]));

export default {
  system: 'outpost',
  label: 'Outposts',
  entryLabel: 'outpost',
  scope: 'account',
  route: GOAL_ROUTES.outpost,
  list: ({ account }) => account?.royalGuardian?.outposts ?? [],
  key: (row) => String(row.mapIndex),
  name: (row) => row.name || `Map ${row.mapIndex}`,
  icon: () => 'etc/Royal_Outpost',
  entryTag: (row) => (row.boosted ? 'Glorified' : null),
  metrics: {
    ...rankMetrics,
    // the card's Glorified marker
    glorified: { label: 'Glorified', value: (row) => (row.boosted ? 1 : 0), boolean: true }
  }
};
