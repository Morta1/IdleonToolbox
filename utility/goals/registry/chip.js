import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'chip',
  label: 'Lab chips',
  entryLabel: 'chip',
  scope: 'account',
  route: GOAL_ROUTES.chip,
  list: ({ account }) => account?.lab?.chips ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/ConsoleChip${row.index}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => row.totalAmount ?? 0 }
  }
};
