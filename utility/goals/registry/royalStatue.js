import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'royalStatue',
  label: 'Royal statues',
  entryLabel: 'royal statue',
  scope: 'account',
  route: GOAL_ROUTES.royalStatue,
  // the unreleased statues have only a number for a name; the page marks them "Unreleased"
  list: ({ account }) => withUniqueNames(
    (account?.royalGuardian?.royalStatues ?? []).filter(({ named }) => named),
    // the name text starts with the bonus value placeholder
    (row) => stableText(row.rawName).replace(/^N /, '')
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/${row.costItem}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
