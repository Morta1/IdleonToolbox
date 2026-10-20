import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const titleCase = (str) => str.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export default {
  system: 'armorSet',
  label: 'Armor Smithy',
  entryLabel: 'armor set',
  scope: 'account',
  route: GOAL_ROUTES.armorSet,
  list: ({ account }) => account?.armorSmithy?.sets ?? [],
  key: (row) => row.setName,
  name: (row) => titleCase(cleanUnderscore(row.setName)),
  icon: (row) => `data/${row.armors?.[0]}`,
  metrics: {
    unlocked: {
      label: 'Unlocked',
      value: (row) => (row.unlocked ? 1 : 0),
      boolean: true
    }
  }
};
