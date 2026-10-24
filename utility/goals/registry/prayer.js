import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'prayer',
  label: 'Prayers',
  entryLabel: 'prayer',
  scope: 'account',
  route: GOAL_ROUTES.prayer,
  list: ({ account }) => account?.prayers ?? [],
  key: (row) => String(row.prayerIndex),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/Prayer${row.prayerIndex}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
