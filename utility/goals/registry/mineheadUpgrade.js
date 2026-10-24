import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'mineheadUpgrade',
  label: 'Minehead upgrades',
  entryLabel: 'Minehead upgrade',
  scope: 'account',
  route: GOAL_ROUTES.mineheadUpgrade,
  // the catalog has one row with no max level; the key stays the catalog index
  list: ({ account }) => withUniqueNames(
    (account?.minehead?.upgrades ?? []).filter((row) => row.maxLevel > 0),
    (row) => stableText(row.name)
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MineUpg${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel, 999) }
  }
};
