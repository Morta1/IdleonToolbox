import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore, getBitIndex } from '@utility/helpers';

export default {
  system: 'fertilizer',
  label: 'Fertilizer upgrades',
  entryLabel: 'fertilizer upgrade',
  scope: 'account',
  route: GOAL_ROUTES.fertilizer,
  list: ({ account }) => (account?.gaming?.fertilizerUpgrades ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.name),
  // the page draws the bits icon of the upgrade's cost
  icon: (row) => `etc/Bits_${getBitIndex(row.cost)}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
