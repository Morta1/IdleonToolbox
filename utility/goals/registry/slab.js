import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

// Items whose art only ships as <name>_x1.png; the slab page falls back to it on a load error
const X1_ONLY = /^(?:MotherlodeTREE|Bone\d+|Tach\d+|DungRNG\d+)$/;

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
  icon: (row) => `data/${row.rawName}${X1_ONLY.test(row.rawName) ? '_x1' : ''}`,
  metrics: {
    obtained: { label: 'Obtained', value: (row) => (row.obtained ? 1 : 0), boolean: true }
  }
};
