import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

const TIERS = ['None', 'Gold', 'Onyx', 'Zenith'];

export default {
  system: 'statue',
  label: 'Statues',
  entryLabel: 'statue',
  scope: 'account',
  route: GOAL_ROUTES.statue,
  // statueIndex is the catalog position, set before the parser drops unnamed slots
  list: ({ account }) => account?.statues ?? [],
  key: (row) => String(row.statueIndex),
  name: (row) => cleanText(row.name).toLowerCase().replace(/^./, (c) => c.toUpperCase()),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      steps: [100, 250]
    },
    tier: {
      label: 'Tier',
      noun: 'rank',
      value: (row, { account }) => account?.statueGrades?.[row.statueIndex] ?? 0,
      tiers: TIERS
    }
  }
};
