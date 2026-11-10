import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { calcTotalItemOwned } from '@parsers/storage';

// The Coral Reef page's balance: the first coral is paid from the reef's own coral, the others from their coral item
const coralOwned = ({ account, characters }, row) => (row.index === 0
  ? account?.coralReef?.ownedCorals ?? 0
  : calcTotalItemOwned(account?.storage, characters, `Coral${row.index}`));

export default {
  system: 'dancingCoral',
  label: 'Dancing coral',
  entryLabel: 'dancing coral',
  scope: 'account',
  route: GOAL_ROUTES.dancingCoral,
  list: ({ account }) => account?.coralReef?.dancingCoral ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.coralName) || `Dancing coral ${row.index + 1}`,
  icon: (row) => `data/Coral${row.index}`,
  metrics: {
    unlocked: {
      label: 'Unlocked',
      value: (row) => (row.unlocked ? 1 : 0),
      boolean: true,
      verb: 'unlock',
      // the game rounds the cost up before it compares and prints it
      cost: { label: 'coral', icon: (n, row) => `data/Coral${row.index}`, have: coralOwned, price: (row) => Math.ceil(row.cost ?? 0) }
    },
    level: { label: 'Shrine LV', noun: 'shrine level', value: (row) => row.level ?? 0 }
  }
};
