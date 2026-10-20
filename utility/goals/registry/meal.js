import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'meal',
  label: 'Meals',
  entryLabel: 'meal',
  scope: 'account',
  route: GOAL_ROUTES.meal,
  list: ({ account }) => account?.cooking?.meals ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      max: (row, { account }) => realCap(account?.cooking?.mealMaxLevel)
    }
  }
};
