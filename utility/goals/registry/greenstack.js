import { cleanUnderscore } from '@utility/helpers';
import { findQuantityOwned } from '@parsers/items';
import { isCountedGreenstack } from '@parsers/misc';
import { createGoal, MAX_TARGET } from '../store';
import { GOAL_ROUTES } from '../routes';
import { itemIcon } from './itemIcon';
import { ownedItemsOf } from './ownedItems';

export const GREENSTACK_AMOUNT = 10e6;

export const greenstackGoal = () =>
  createGoal({ system: 'greenstack', kind: 'all', metric: 'quantity', target: MAX_TARGET });

export default {
  system: 'greenstack',
  label: 'Greenstacks',
  entryLabel: 'greenstack',
  scope: 'account',
  route: GOAL_ROUTES.greenstack,
  list: ({ account }) => (account?.looty?.slabItems ?? []).filter(isCountedGreenstack),
  key: (row) => row.itemRawName,
  wikiId: (key) => `item:${key}`,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => itemIcon(row.rawName),
  metrics: {
    quantity: {
      label: 'Quantity',
      // The game keeps an item greenstacked after the stack drops below 10M
      value: (row, ctx) => row.greenStacked
        ? GREENSTACK_AMOUNT
        : Math.min(findQuantityOwned(ownedItemsOf(ctx), row.name).amount ?? 0, GREENSTACK_AMOUNT),
      max: () => GREENSTACK_AMOUNT,
      steps: [1000000, GREENSTACK_AMOUNT]
    }
  }
};
