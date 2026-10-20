import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';

export default {
  system: 'landRank',
  label: 'Land ranks',
  entryLabel: 'land rank upgrade',
  scope: 'account',
  route: GOAL_ROUTES.landRank,
  list: ({ account }) => withUniqueNames(
    (account?.farming?.ranks ?? []).map((row, pos) => ({ ...row, pos })),
    (row) => cleanUnderscore(row.name ?? '')
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  icon: (row) => `data/RankUpg${row.pos}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.upgradeLevel ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
