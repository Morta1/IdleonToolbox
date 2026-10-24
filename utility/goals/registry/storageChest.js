import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';

export default {
  system: 'storageChest',
  label: 'Storage chests',
  entryLabel: 'storage chest',
  scope: 'account',
  route: GOAL_ROUTES.storageChest,
  list: ({ account }) => account?.storage?.storageChests ?? [],
  key: (row) => row.rawName,
  name: (row) => capitalizeFirst(cleanUnderscore(row.displayName).toLowerCase()),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'own' }
  }
};
