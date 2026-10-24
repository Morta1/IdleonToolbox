import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

// Totems 5-7 show these names on the page
const NAME_OVERRIDES = { 5: 'Citric Conflict', 6: 'Breezy Battle', 7: 'Pufferblob Brawl' };

export default {
  system: 'totem',
  label: 'Totems',
  entryLabel: 'totem',
  scope: 'account',
  route: GOAL_ROUTES.totem,
  // built 1:1 from the totem catalog, so the position is the key
  list: ({ account }) => (account?.totems ?? []).map((totem, index) => ({ ...totem, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(NAME_OVERRIDES[row.index] ?? row.name ?? `Totem ${row.index + 1}`),
  icon: (row) => `etc/totem_${row.index}`,
  metrics: {
    wave: {
      label: 'Max wave',
      value: (row) => row.maxWave ?? 0,
      steps: [50, 100]
    }
  }
};
