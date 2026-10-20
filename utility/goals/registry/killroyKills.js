import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'killroyKills',
  label: 'Killroy kills',
  entryLabel: 'monster',
  scope: 'account',
  route: GOAL_ROUTES.killroyKills,
  list: ({ account }) => account?.killroy?.list ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name ?? row.rawName),
  icon: (row) => `data/${row.icon}`,
  metrics: {
    kills: {
      label: 'Kills',
      value: (row) => Number(row.killRoyKills) || 0,
      steps: [1000, 10000]
    }
  }
};
