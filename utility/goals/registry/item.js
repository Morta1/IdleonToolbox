import { findQuantityOwned } from '@parsers/items';
import { itemsArray } from '@website-data';
import { cleanUnderscore } from '@utility/helpers';
import { isTrackableItem } from '@utility/materialTracker';
import { GOAL_ROUTES } from '../routes';
import { ownedItemsOf } from './ownedItems';
import { withUniqueNames } from './names';

const owned = (row, ctx) => findQuantityOwned(ownedItemsOf(ctx), row.displayName).amount ?? 0;

// Built once: the catalog does not change, and the search lists every row
let rows;
const trackableItems = () => {
  rows ??= withUniqueNames(itemsArray.filter(isTrackableItem), (row) => cleanUnderscore(row.displayName));
  return rows;
};

export default {
  system: 'item',
  label: 'Items',
  entryLabel: 'item',
  scope: 'account',
  route: GOAL_ROUTES.item,
  list: () => trackableItems(),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
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
