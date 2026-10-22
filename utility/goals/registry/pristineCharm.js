import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'pristineCharm',
  label: 'Pristine charms',
  entryLabel: 'pristine charm',
  scope: 'account',
  route: GOAL_ROUTES.pristineCharm,
  list: ({ account }) => account?.sneaking?.pristineCharms ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' }
  }
};
