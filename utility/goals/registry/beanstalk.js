import { BEANSTALK_BREAKPOINTS, getBeanstalkFoods } from '@parsers/misc';
import { cleanUnderscore, notateNumber } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'beanstalk',
  label: 'Beanstalk',
  entryLabel: 'golden food',
  scope: 'account',
  route: GOAL_ROUTES.beanstalk,
  list: ({ account }) => getBeanstalkFoods(account?.sneaking?.beanstalkData),
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName ?? row.rawName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    // one rank per breakpoint the page shows ("2.22K / 10K"); the last one maxes the food
    rank: { label: 'Rank', noun: 'rank', value: (row) => row.rank ?? 0, tiers: ['None', ...BEANSTALK_BREAKPOINTS.map((amount) => notateNumber(amount))] }
  }
};
