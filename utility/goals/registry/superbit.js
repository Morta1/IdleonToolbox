import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst, withUniqueNames } from './names';
import { cleanUnderscore, getBitIndex, notateNumber } from '@utility/helpers';

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
    unlocked: {
      label: 'Unlocked',
      value: (row) => (row.unlocked ? 1 : 0),
      boolean: true,
      verb: 'buy',
      // bits climb icon tiers like the Gaming page draws them: the icon names the tier, the amount is within it
      cost: {
        label: 'bits',
        icon: (n) => `etc/Bits_${getBitIndex(n)}`,
        format: (n) => String(notateNumber(n, 'bits')),
        have: ({ account }) => account?.gaming?.bits ?? 0,
        price: (row) => row.cost
      }
    }
  }
};
