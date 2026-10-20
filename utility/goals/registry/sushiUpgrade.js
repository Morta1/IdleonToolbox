import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'sushiUpgrade',
  label: 'Sushi Station upgrades',
  entryLabel: 'Sushi Station upgrade',
  scope: 'account',
  route: GOAL_ROUTES.sushiUpgrade,
  // the page lists by display order; upgradeIndex is the game's upgrade id
  list: ({ account }) => withUniqueNames(account?.sushiStation?.upgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.upgradeIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/SushiUpg${row.upgradeIndex}`,
  metrics: {
    // endless upgrades carry Infinity
    level: { label: 'Level', value: (row) => row.level ?? 0, max: (row) => realCap(Number.isFinite(row.maxLevel) ? row.maxLevel : null) }
  }
};
