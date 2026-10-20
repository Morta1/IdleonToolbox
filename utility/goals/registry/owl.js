import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'owl',
  label: 'Orion upgrades',
  entryLabel: 'Orion upgrade',
  scope: 'account',
  route: GOAL_ROUTES.owl,
  list: ({ account }) => (account?.owl?.upgrades ?? []).map((upgrade, index) => ({ ...upgrade, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `etc/Owl_${row.index}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
