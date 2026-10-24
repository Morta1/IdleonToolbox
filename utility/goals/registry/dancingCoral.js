import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'dancingCoral',
  label: 'Dancing coral',
  entryLabel: 'dancing coral',
  scope: 'account',
  route: GOAL_ROUTES.dancingCoral,
  list: ({ account }) => account?.coralReef?.dancingCoral ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.coralName) || `Dancing coral ${row.index + 1}`,
  icon: (row) => `data/Coral${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
