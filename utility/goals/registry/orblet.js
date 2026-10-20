import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanText } from './names';

export default {
  system: 'orblet',
  label: 'Orblet market',
  entryLabel: 'orblet upgrade',
  scope: 'account',
  route: GOAL_ROUTES.orblet,
  list: ({ account }) => account?.royalGuardian?.orbletMarket ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  icon: () => 'data/Orblet',
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
