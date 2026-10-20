import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'salt',
  label: 'Salts',
  entryLabel: 'salt',
  scope: 'account',
  route: GOAL_ROUTES.salt,
  list: ({ account }) => account?.refinery?.salts ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.saltName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    rank: {
      label: 'Rank',
      value: (row) => row.rank ?? 0,
      steps: [10, 25]
    }
  }
};
