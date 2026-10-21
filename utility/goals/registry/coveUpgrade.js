import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

export default {
  system: 'coveUpgrade',
  label: 'Crystal Glunko Cove upgrades',
  entryLabel: 'Cove upgrade',
  scope: 'account',
  route: GOAL_ROUTES.coveUpgrade,
  groups: {
    label: 'Section',
    of: (row) => row.group,
    names: { crystal: 'Crystal upgrades', jeweled: 'Jeweled upgrades' }
  },
  list: ({ account }) => account?.hole?.caverns?.crystalGlunkoCove?.upgrades ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  // the gooey shape the upgrade is paid in, as on its card
  icon: (row) => `data/${row.shapeName}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
