import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

// The gem counters stop at 10M
const GEMSTONE_MAX = 1e7;

export default {
  system: 'gemstone',
  label: 'Gemstones',
  entryLabel: 'gemstone',
  scope: 'account',
  route: GOAL_ROUTES.gemstone,
  list: ({ account }) => account?.sneaking?.gemStones ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    value: { label: 'Gems', value: (row) => row.baseValue ?? 0, max: () => GEMSTONE_MAX }
  }
};
