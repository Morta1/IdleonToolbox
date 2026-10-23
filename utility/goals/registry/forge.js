import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';

export default {
  system: 'forge',
  label: 'Forge upgrades',
  entryLabel: 'forge upgrade',
  scope: 'account',
  route: GOAL_ROUTES.forge,
  // the parser builds this 1:1 from its upgrade catalog, so the position is the key
  list: ({ account }) => (account?.forge?.upgrades ?? []).map((upgrade, index) => ({ ...upgrade, index })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: () => 'data/ForgeA',
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel),
      steps: [10, 50]
    }
  }
};
