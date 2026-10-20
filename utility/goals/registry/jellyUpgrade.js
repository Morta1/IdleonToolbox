import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'jellyUpgrade',
  label: 'Jelly Operator upgrades',
  entryLabel: 'Jelly Operator upgrade',
  scope: 'account',
  route: GOAL_ROUTES.jellyUpgrade,
  // the page lists by display order; id is the game's upgrade id
  list: ({ account }) => withUniqueNames(account?.jellyOperator?.upgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.id),
  name: (row) => row.goalName,
  icon: (row) => `data/JellyUpg${row.id}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
