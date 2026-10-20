import { GOAL_ROUTES } from '../routes';

export default {
  system: 'killroyUpgrade',
  label: 'Killroy upgrades',
  entryLabel: 'Killroy upgrade',
  scope: 'account',
  route: GOAL_ROUTES.killroyUpgrade,
  // built 1:1 from a fixed array in the parser, so the position is the key
  list: ({ account }) => (account?.killroy?.upgrades ?? []).map((upgrade, index) => ({ ...upgrade, index })),
  key: (row) => String(row.index),
  name: (row) => row.upgrade ?? row.description,
  icon: (row) => `etc/Killroy_${row.index}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
