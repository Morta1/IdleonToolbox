import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'riftBonus',
  label: 'Rift bonuses',
  entryLabel: 'rift bonus',
  scope: 'account',
  route: GOAL_ROUTES.riftBonus,
  // the Bonuses tab: the rift rows that carry a bonus; the key is the rift index
  list: ({ account }) => (account?.rift?.list ?? []).map((row, pos) => ({ ...row, pos })).filter((row) => row.riftBonus),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.riftBonus),
  icon: (row) => `etc/${row.riftBonusIcon}`,
  metrics: {
    unlocked: {
      label: 'Unlocked',
      value: (row, { account }) => (row.pos <= (account?.rift?.currentRift ?? 0) ? 1 : 0),
      boolean: true,
      verb: 'unlock'
    }
  }
};
