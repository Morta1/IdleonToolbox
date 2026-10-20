import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'jellyCell',
  label: 'Jelly cells',
  entryLabel: 'jelly cell',
  scope: 'account',
  route: GOAL_ROUTES.jellyCell,
  list: ({ account }) => withUniqueNames(account?.jellyOperator?.cells ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/JellyUnit${row.index}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
