import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'hatRack',
  label: 'Hat Rack',
  entryLabel: 'premium helmet',
  scope: 'account',
  route: GOAL_ROUTES.hatRack,
  list: ({ account }) => account?.hatRack?.allPremiumHelmets ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName || row.rawName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    acquired: {
      label: 'Acquired',
      value: (row) => (row.isAcquired ? 1 : 0),
      boolean: true,
      verb: 'own'
    }
  }
};
