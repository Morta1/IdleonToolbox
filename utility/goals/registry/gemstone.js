import { GEMSTONE_MAX_VALUE } from '@parsers/world-6/sneaking';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

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
    value: { label: 'Gems', value: (row) => row.baseValue ?? 0, max: () => GEMSTONE_MAX_VALUE }
  }
};
