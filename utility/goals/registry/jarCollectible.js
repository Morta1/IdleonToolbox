import { GOAL_ROUTES } from '../routes';

export default {
  system: 'jarCollectible',
  label: 'Jar collectibles',
  entryLabel: 'collectible',
  scope: 'account',
  route: GOAL_ROUTES.jarCollectible,
  list: ({ account }) => (account?.hole?.caverns?.theJars?.collectibles ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `data/HoleJarC${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
