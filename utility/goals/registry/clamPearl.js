import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'clamPearl',
  label: 'Clam Work upgrades',
  entryLabel: 'Clam Work upgrade',
  scope: 'account',
  route: GOAL_ROUTES.clamPearl,
  list: ({ account }) => withUniqueNames(account?.clamWork?.upgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: () => 'data/ClamPearl0',
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
