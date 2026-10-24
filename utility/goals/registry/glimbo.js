import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'glimbo',
  label: 'Glimbo trades',
  entryLabel: 'Glimbo trade',
  scope: 'account',
  route: GOAL_ROUTES.glimbo,
  // a trade is named after the vault upgrade it raises
  list: ({ account }) => withUniqueNames(
    account?.minehead?.glimbo ?? [],
    (row) => stableText(row.upgradeName) || stableText(row.itemName) || `Trade ${row.index + 1}`
  ),
  key: (row) => String(row.vaultIdx),
  name: (row) => row.goalName,
  icon: (row) => `data/VaultUpg${row.vaultIdx}`,
  metrics: {
    trades: { label: 'Trades', value: (row) => row.trades ?? 0 }
  }
};
