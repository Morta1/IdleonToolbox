import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'jewel',
  label: 'Lab jewels',
  entryLabel: 'jewel',
  scope: 'account',
  route: GOAL_ROUTES.jewel,
  list: ({ account }) => account?.lab?.jewels ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  // the catalog rows carry no rawName when logged out
  icon: (row) => `data/ConsoleJwl${row.index}`,
  metrics: {
    acquired: { label: 'Acquired', value: (row) => (row.acquired ? 1 : 0), boolean: true, verb: 'own' }
  }
};
