import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst, withUniqueNames } from './names';
import { cleanUnderscore, getBitIndex } from '@utility/helpers';

export default {
  system: 'superbit',
  label: 'Superbits',
  entryLabel: 'superbit',
  scope: 'account',
  route: GOAL_ROUTES.superbit,
  groups: {
    label: 'Tier',
    of: (row) => (row.isZuper ? 'zuper' : row.isDuper ? 'duper' : 'super'),
    names: { super: 'Super bits', duper: 'Duper bits', zuper: 'Zuper bits' }
  },
  list: ({ account }) => withUniqueNames(account?.gaming?.superbitsUpgrades ?? [], (row) => capitalizeFirst(cleanUnderscore(row.name))),
  key: (row) => String(row.originalIndex),
  name: (row) => row.goalName,
  // the page draws the bits icon of the cost
  icon: (row) => `etc/Bits_${getBitIndex(row.cost)}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true }
  }
};
