import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'summonStone',
  label: 'Summoning stones',
  entryLabel: 'stone',
  scope: 'account',
  route: GOAL_ROUTES.summonStone,
  list: ({ account }) => account?.summoning?.summoningStones ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name ?? row.stoneName ?? ''),
  icon: (row) => `etc/SumStone_${row.index}`,
  metrics: {
    kills: { label: 'Kills', value: (row) => row.kills ?? 0 }
  }
};
