import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

export default {
  system: 'bubbaMegaflesh',
  label: 'Megaflesh',
  entryLabel: 'Megaflesh',
  scope: 'account',
  route: GOAL_ROUTES.bubbaMegaflesh,
  list: ({ account }) => (account?.bubba?.megaFlesh ?? []).map((megaflesh, index) => ({ ...megaflesh, index })),
  key: (row) => String(row.index),
  // the first line of the catalog text; the second one prints the live bonus
  name: (row) => stableText(String(row.description ?? '').split('\n')[0]),
  icon: (row) => `data/BubbaMF${row.index}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true }
  }
};
