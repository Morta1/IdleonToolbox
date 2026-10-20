import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

const STAR_TIERS = ['None', ...Array.from({ length: 7 }, (_, i) => `${i + 1}★`)];

// a few saves hold the count as a numeric string
const copies = (row) => Number(row.amount) || 0;

export default {
  system: 'card',
  label: 'Cards',
  entryLabel: 'card',
  scope: 'account',
  route: GOAL_ROUTES.card,
  list: ({ account }) => Object.values(account?.cards ?? {}),
  key: (row) => String(row.cardIndex),
  name: (row) => cleanUnderscore(row.displayName),
  icon: (row) => `data/2Cards${row.cardIndex}`,
  metrics: {
    // stars is 0-indexed and meaningless while no copy is owned
    stars: {
      label: 'Stars',
      value: (row) => (copies(row) > 0 ? (row.stars ?? 0) + 1 : 0),
      tiers: STAR_TIERS
    },
    amount: { label: 'Copies', value: copies, steps: [10, 100] }
  }
};
