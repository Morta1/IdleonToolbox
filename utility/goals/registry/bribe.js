import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'bribe',
  label: 'Bribes',
  entryLabel: 'bribe',
  scope: 'account',
  route: GOAL_ROUTES.bribe,
  list: ({ account }) => (account?.bribes ?? []).map((bribe, index) => ({ ...bribe, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: () => 'etc/Bribe',
  metrics: {
    purchased: {
      label: 'Purchased',
      value: (row) => (row.done ? 1 : 0),
      boolean: true
    }
  }
};
