import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

const PLACEHOLDER_NAME = 'Hmm...';
const sentenceCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export default {
  system: 'equinoxUpgrade',
  label: 'Equinox upgrades',
  entryLabel: 'Equinox upgrade',
  scope: 'account',
  route: GOAL_ROUTES.equinoxUpgrade,
  // index is the catalog position, taken before the page's placeholder slot is dropped
  list: ({ account }) => (account?.equinox?.upgrades ?? [])
    .map((upgrade, index) => ({ ...upgrade, index }))
    .filter(({ name }) => name !== PLACEHOLDER_NAME),
  key: (row) => String(row.index),
  name: (row) => sentenceCase(cleanText(row.name)),
  icon: (row) => `etc/Dream_Upgrade_${row.index + 1}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.lvl ?? 0,
      max: (row) => realCap(row.maxLvl)
    }
  }
};
