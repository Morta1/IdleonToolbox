import { ARMORY_PLACEHOLDER, realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

export default {
  system: 'armory',
  label: 'Royal Armory',
  entryLabel: 'upgrade',
  scope: 'account',
  route: GOAL_ROUTES.armory,
  list: ({ account }) => (account?.royalGuardian?.armory?.upgrades ?? []).filter(({ slot }) => slot >= 0),
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  icon: (row) => `data/${row.costResourceRawName}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level,
      max: (row) => realCap(row.maxLevel, ARMORY_PLACEHOLDER)
    }
  }
};
