import { realCap } from '../caps';
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
  name: (row) => row.displayName,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level,
      max: (row) => realCap(row.maxLevel),
      steps: [10, 50]
    }
  }
};
