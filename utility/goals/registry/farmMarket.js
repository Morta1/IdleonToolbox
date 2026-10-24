import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers, withUniqueNames } from './names';

export default {
  system: 'farmMarket',
  label: 'Farming market',
  entryLabel: 'market upgrade',
  scope: 'account',
  route: GOAL_ROUTES.farmMarket,
  groups: {
    label: 'Market',
    of: (row) => (row.pos < 8 ? 'day' : 'night'),
    names: { day: 'Day market', night: 'Night market' }
  },
  list: ({ account }) => withUniqueNames(
    (account?.farming?.market ?? []).map((row, pos) => ({ ...row, pos })),
    (row) => titleCaseTiers(row.name)
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  // the page draws the crop each upgrade is paid in
  icon: (row) => `data/${row.pos < 8 ? `FarmCrop${row.type}` : 'FarmCropBean'}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLvl)
    }
  }
};
