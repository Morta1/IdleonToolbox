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
  // two names end in a $ (a money sign in game) that reads as a placeholder
  name: (row) => cleanUpgradeName(row.name).replace(/[$]/g, '').trim(),
  icon: (row) => `data/VaultUpg${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
