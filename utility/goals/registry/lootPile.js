import { GOAL_ROUTES } from '../routes';

export default {
  system: 'lootPile',
  label: 'Loot pile',
  entryLabel: 'loot',
  scope: 'account',
  route: GOAL_ROUTES.lootPile,
  list: ({ account }) => account?.sailing?.lootPile ?? [],
  key: (row) => row.rawName,
  name: (row) => `Loot ${Number(row.rawName.replace(/\D/g, '')) + 1}`,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    amount: { label: 'Amount', value: (row) => row.amount ?? 0 }
  }
};
