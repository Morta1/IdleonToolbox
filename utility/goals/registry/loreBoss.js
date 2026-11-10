import { GOAL_ROUTES } from '../routes';
import { getAmberDenominator, MAX_GRAND_DISCOVERIES } from '@parsers/world-7/spelunking';
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
    },
    // in the current amber colour, as the boss card prints it (the save keeps it as a string)
    biggestHaul: {
      label: 'Biggest haul',
      value: (row, { account }) => (Number(row.biggestHaul) || 0) / getAmberDenominator(account)
    },
    // a cave's last rock is its boss: its power requirement is the boss's
    power: {
      label: 'Power',
      value: (row, { account }) => account?.spelunking?.power?.value ?? 0,
      max: (row, { account }) => account?.spelunking?.discoveries?.[row.index]?.at(-1)?.powerReq
    }
  }
};
