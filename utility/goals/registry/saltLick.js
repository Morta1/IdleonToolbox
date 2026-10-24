import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

// The bonus text carries a "{" where the page prints the live value
const bonusText = (desc) => cleanUnderscore(String(desc ?? '').replace(/\+?\{%?_?/, '')).trim();

export default {
  system: 'saltLick',
  label: 'Salt Lick',
  entryLabel: 'upgrade',
  scope: 'account',
  route: GOAL_ROUTES.saltLick,
  // built 1:1 from the catalog by the parser; rawName repeats (two bonuses per salt), so the position is the key
  list: ({ account }) => (account?.saltLick ?? []).map((upgrade, index) => ({ ...upgrade, index })),
  key: (row) => String(row.index),
  name: (row) => `${cleanUnderscore(row.name)}: ${bonusText(row.desc)}`,
  icon: (row) => `data/${row.rawName}`,
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
