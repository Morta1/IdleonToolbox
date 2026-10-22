import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'clamCompensation',
  label: 'Compensations',
  entryLabel: 'compensation',
  scope: 'account',
  route: GOAL_ROUTES.clamCompensation,
  // the parser maps the compensation catalog 1:1, so the position is the key
  list: ({ account }) => withUniqueNames((account?.clamWork?.compensations ?? []).map((row, index) => ({ ...row, index })),
    (row) => cleanUnderscore(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  // the cards have no art: the Clam Work page icon stands in
  icon: () => 'data/ClamPearl0',
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked === 1 ? 1 : 0), boolean: true, verb: 'unlock' }
  }
};
