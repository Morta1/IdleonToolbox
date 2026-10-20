import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'jellyObstruction',
  label: 'Jelly obstructions',
  entryLabel: 'obstruction',
  scope: 'account',
  route: GOAL_ROUTES.jellyObstruction,
  // the page hides the unreleased obstructions; the key stays the catalog index
  list: ({ account }) => withUniqueNames(
    (account?.jellyOperator?.obstructions ?? []).filter((row) => !row.placeholder),
    (row) => stableText(row.name)
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/JellyOp${row.index}`,
  metrics: {
    defeated: { label: 'Defeated', value: (row) => (row.defeated ? 1 : 0), boolean: true }
  }
};
