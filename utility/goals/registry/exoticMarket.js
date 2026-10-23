import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers, withUniqueNames } from './names';

export default {
  system: 'exoticMarket',
  label: 'Exotic market',
  entryLabel: 'exotic upgrade',
  scope: 'account',
  route: GOAL_ROUTES.exoticMarket,
  list: ({ account }) => withUniqueNames(
    account?.farming?.exoticMarket ?? [],
    (row) => titleCaseTiers(row.name)
  ),
  // the parser drops the NAME_MAGNI placeholder, so the position shifts; the game index stays put
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/FarmCrop${row.x2}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
