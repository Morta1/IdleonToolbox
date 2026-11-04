import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanUpgradeName } from './names';

export default {
  system: 'vaultUpgrade',
  label: 'Upgrade vault',
  entryLabel: 'vault upgrade',
  scope: 'account',
  route: GOAL_ROUTES.vaultUpgrade,
  list: ({ account }) => account?.upgradeVault?.upgrades ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUpgradeName(row.name),
  icon: (row) => `data/VaultUpg${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
