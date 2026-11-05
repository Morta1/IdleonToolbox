import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'capeVine',
  label: 'Cape Vine',
  entryLabel: 'cape',
  scope: 'account',
  route: GOAL_ROUTES.capeVine,
  list: ({ account }) => account?.capeVine?.allCapes ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName || row.rawName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    acquired: {
      label: 'On the vine',
      value: (row) => (row.isAcquired ? 1 : 0),
      boolean: true,
      verb: 'own'
    }
  }
};
