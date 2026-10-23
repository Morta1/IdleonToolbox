import { GOAL_ROUTES } from '../routes';

export default {
  system: 'villager',
  label: 'Villagers',
  entryLabel: 'villager',
  scope: 'account',
  route: GOAL_ROUTES.villager,
  list: ({ account }) => account?.hole?.villagers ?? [],
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `etc/Villager_${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 },
    opals: { label: 'Opals invested', value: (row) => Number(row.opalInvested) || 0 }
  }
};
