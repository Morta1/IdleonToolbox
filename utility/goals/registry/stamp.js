import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const CATEGORIES = ['combat', 'skills', 'misc'];

export default {
  system: 'stamp',
  label: 'Stamps',
  entryLabel: 'stamp',
  scope: 'account',
  route: GOAL_ROUTES.stamp,
  groups: {
    label: 'Category',
    of: (row) => row.category,
    names: { combat: 'Combat', skills: 'Skills', misc: 'Misc' }
  },
  list: ({ account }) => CATEGORIES.flatMap((category) =>
    (account?.stamps?.[category] ?? []).map((stamp) => ({ ...stamp, category }))),
  key: (row) => `${row.category}:${row.rawName}`,
  name: (row) => cleanUnderscore(row.displayName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    // No max: maxLevel is only the gold cap, which materials raise without limit
    level: {
      label: 'Level',
      value: (row) => row.level,
      steps: [10, 50]
    }
  }
};
