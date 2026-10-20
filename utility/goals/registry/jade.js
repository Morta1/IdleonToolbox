import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';

// Rows the game ships as placeholders until their bonus is released
const PLACEHOLDER_NAME = 'UNDER_CONSTRUCTION';

export default {
  system: 'jade',
  label: 'Jade emporium',
  entryLabel: 'jade upgrade',
  scope: 'account',
  route: GOAL_ROUTES.jade,
  // the page lists by display order; originalIndex is the game's upgrade id
  list: ({ account }) => withUniqueNames(
    (account?.sneaking?.jadeEmporium ?? []).filter(({ name }) => name !== PLACEHOLDER_NAME),
    (row) => cleanUnderscore(row.name ?? '')
  ),
  key: (row) => String(row.originalIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/NjJupg${row.x3}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true }
  }
};
