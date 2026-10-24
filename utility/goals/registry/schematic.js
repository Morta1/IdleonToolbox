import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'schematic',
  label: 'Schematics',
  entryLabel: 'schematic',
  scope: 'account',
  route: GOAL_ROUTES.schematic,
  list: ({ account }) => account?.hole?.engineerBonuses ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/HoleUIbuildUpg${row.index}`,
  metrics: {
    unlocked: { label: 'Created', value: (row) => (row.unlocked ? 1 : 0), boolean: true }
  }
};
