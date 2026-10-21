import { GOAL_ROUTES } from '../routes';

export default {
  system: 'farmPlot',
  label: 'Farming plots',
  entryLabel: 'plot',
  scope: 'account',
  route: GOAL_ROUTES.farmPlot,
  list: ({ account }) => account?.farming?.plot ?? [],
  key: (row) => String(row.index),
  name: (row) => `Plot ${row.index + 1}`,
  // the seed the plot card shows
  icon: (row) => `etc/Seed_${row.seedType ?? 0}`,
  metrics: {
    rank: { label: 'Land rank', value: (row) => row.rank ?? 0 },
    og: { label: 'OG', value: (row) => row.currentOG ?? 0 }
  }
};
