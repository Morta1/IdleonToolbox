import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

// unlocked runs -1 (undiscovered) to 4; the tier is that plus one so the first rung is "Locked"
const TIERS = ['Locked', 'Unlocked', 'Boost', 'Jade', 'Ethereal', 'Eclectic'];
// The page stops after sigil 24, the rest of the catalog is unreleased
const LAST_SHOWN_INDEX = 24;

export default {
  system: 'sigil',
  label: 'Sigils',
  entryLabel: 'sigil',
  scope: 'account',
  route: GOAL_ROUTES.sigil,
  list: ({ account }) => (account?.alchemy?.p2w?.sigils ?? []).filter(({ index }) => index <= LAST_SHOWN_INDEX),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/aSiga${row.index}`,
  metrics: {
    tier: {
      label: 'Tier',
      value: (row) => Math.max(0, (row.unlocked ?? -1) + 1),
      tiers: TIERS
    }
  }
};
