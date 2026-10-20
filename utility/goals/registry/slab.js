import { GOAL_ROUTES } from '../routes';
import { itemIcon } from './itemIcon';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'slab',
  label: 'Slab',
  entryLabel: 'slab item',
  scope: 'account',
  route: GOAL_ROUTES.slab,
  // a few slab ids have no item behind them (DungRNG0); without a name they would show as raw ids
  list: ({ account }) => (account?.looty?.slabItems ?? []).filter(({ name }) => name),
  key: (row) => row.itemRawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => itemIcon(row.rawName),
  metrics: {
    obtained: { label: 'Obtained', value: (row) => (row.obtained ? 1 : 0), boolean: true }
  }
};
