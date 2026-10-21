import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { RIBBON_MAX_RANK, RIBBON_SHELF_SLOTS } from '@parsers/world-4/cooking';

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
    },
    // the Meals tab ribbon: the meal ranks sit after the Ribbon Shelf slots
    ribbon: {
      label: 'Ribbon rank',
      value: (row, { account }) => account?.grimoire?.ribbons?.[RIBBON_SHELF_SLOTS + row.index] ?? 0,
      max: () => RIBBON_MAX_RANK
    }
  }
};
