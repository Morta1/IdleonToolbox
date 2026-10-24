import { GOAL_ROUTES } from '../routes';
import { MAX_GRAND_DISCOVERIES } from '@parsers/world-7/spelunking';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'loreBoss',
  label: 'Lore bosses',
  entryLabel: 'lore boss',
  scope: 'account',
  route: GOAL_ROUTES.loreBoss,
  // the parser drops the numeric placeholder rows; index is the cave
  list: ({ account }) => withUniqueNames(account?.spelunking?.loreBosses ?? [], (row) => stableText(row.description)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/CaveBoss${row.index}`,
  metrics: {
    defeated: { label: 'Defeated', value: (row) => (row.defeated ? 1 : 0), boolean: true },
    grandDiscoveries: {
      label: 'Grand discoveries',
      value: (row) => row.grandDiscoveriesFound ?? 0,
      max: () => MAX_GRAND_DISCOVERIES
    }
  }
};
