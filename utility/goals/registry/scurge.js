import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'scurge',
  label: 'Scurge upgrades',
  entryLabel: 'Scurge upgrade',
  scope: 'account',
  route: GOAL_ROUTES.scurge,
  list: ({ account }) => withUniqueNames(account?.clamWork?.scurge?.upgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  // the Scurge cards have no icon of their own, so the page's own icon stands in
  icon: () => 'data/ClamPearl0',
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
