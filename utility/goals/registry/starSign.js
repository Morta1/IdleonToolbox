import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'starSign',
  label: 'Star signs',
  entryLabel: 'star sign',
  scope: 'account',
  route: GOAL_ROUTES.starSign,
  // the page hides the Unknown and Filler signs
  list: ({ account }) => withUniqueNames(
    (account?.starSigns ?? []).filter(({ indexedStarName }) => !/Filler|Unknown/.test(indexedStarName)),
    (row) => cleanUnderscore(row.starName)
  ),
  key: (row) => row.starName,
  name: (row) => row.goalName,
  // the page draws no picture per sign: the star icon it puts next to infinite stars
  icon: () => 'data/SignStarInf0',
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' }
  }
};
