import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { isRealAchievement } from '@parsers/achievements';

export default {
  system: 'achievement',
  label: 'Achievements',
  entryLabel: 'achievement',
  scope: 'account',
  route: GOAL_ROUTES.achievement,
  // built 1:1 from the catalog, so the position is the key; the page hides the unreleased slots
  list: ({ account }) => (account?.achievements ?? [])
    .map((achievement, index) => ({ ...achievement, index }))
    .filter(isRealAchievement),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    completed: { label: 'Completed', value: (row) => (row.completed ? 1 : 0), boolean: true }
  }
};
