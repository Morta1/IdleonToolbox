import { MAX_VIAL_LEVEL } from '@parsers/world-2/alchemy';
import { cleanUnderscore, pascalCase } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'vial',
  label: 'Vials',
  entryLabel: 'vial',
  scope: 'account',
  route: GOAL_ROUTES.vial,
  list: ({ account }) => account?.alchemy?.vials ?? [],
  key: (row) => row.mainItem,
  name: (row) => pascalCase(cleanUnderscore(row.name)),
  icon: (row) => `data/${row.mainItem}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      max: () => MAX_VIAL_LEVEL
    }
  }
};
