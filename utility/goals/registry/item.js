import { findQuantityOwned } from '@parsers/items';
import { itemsArray } from '@website-data';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { ownedItemsOf } from './ownedItems';

const owned = (row, ctx) => findQuantityOwned(ownedItemsOf(ctx), row.displayName).amount ?? 0;

export default {
  system: 'item',
  label: 'Items',
  entryLabel: 'item',
  scope: 'account',
  route: GOAL_ROUTES.item,
  list: () => itemsArray,
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName),
  icon: (row) => `data/${row.rawName}`,
  // The catalog has items without art, so only owned ones are checked for an icon
  iconRows: (rows, ctx) => rows.filter((row) => owned(row, ctx) > 0),
  metrics: {
    quantity: {
      label: 'Quantity',
      value: owned,
      steps: [1000, 1000000]
    }
  }
};
