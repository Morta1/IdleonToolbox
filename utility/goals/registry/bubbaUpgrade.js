import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'bubbaUpgrade',
  label: 'Bubba upgrades',
  entryLabel: 'Bubba upgrade',
  scope: 'account',
  route: GOAL_ROUTES.bubbaUpgrade,
  // the parser maps the upgrade catalog 1:1, so the position is the upgrade index
  list: ({ account }) => (account?.bubba?.upgrades ?? []).map((upgrade, index) => ({ ...upgrade, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `etc/Bubbo_Upgrade_${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
