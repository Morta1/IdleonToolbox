import { cleanUnderscore } from '@utility/helpers';
import { HIDDEN_INVENTORY_BAG } from '@parsers/character';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'bag',
  label: 'Inventory bags',
  entryLabel: 'bag',
  scope: 'character',
  route: GOAL_ROUTES.bag,
  list: ({ character }) => (character?.invBagsUsed ?? []).filter(({ displayName }) => displayName !== HIDDEN_INVENTORY_BAG),
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => (row.acquired ? 1 : 0), boolean: true }
  }
};
