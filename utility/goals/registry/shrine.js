import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'shrine',
  label: 'Shrines',
  entryLabel: 'shrine',
  scope: 'account',
  route: GOAL_ROUTES.shrine,
  list: ({ account }) => account?.shrines ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.shrineLevel ?? 0,
      steps: [100, 250]
    }
  }
};
