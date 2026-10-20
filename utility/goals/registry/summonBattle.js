import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';

const COLOURS = { 0: 'White', 1: 'Green', 2: 'Yellow', 3: 'Blue', 4: 'Purple', 5: 'Red', 6: 'Cyan', 7: 'Teal' };
// allBattles[9] is the endless list, which the Battles tab builds into the shared array when it renders
const BATTLE_WORLDS = 9;

export default {
  system: 'summonBattle',
  label: 'Summoning battles',
  entryLabel: 'battle',
  scope: 'account',
  route: GOAL_ROUTES.summonBattle,
  groups: {
    label: 'Colour',
    of: (row) => String(row.world),
    names: COLOURS
  },
  list: ({ account }) => withUniqueNames(
    (account?.summoning?.allBattles ?? []).slice(0, BATTLE_WORLDS).flatMap((battles, world) =>
      (battles ?? []).map((battle) => ({ ...battle, world }))),
    (row) => cleanUnderscore(row.territoryName ?? row.enemyId ?? '')
  ),
  key: (row) => row.enemyId,
  name: (row) => row.goalName,
  // the page renders row.icon, a prefixed .png path
  icon: (row) => String(row.icon ?? '').replace(/^\//, '').replace(/\.png$/, ''),
  metrics: {
    won: { label: 'Won', value: (row) => (row.won ? 1 : 0), boolean: true }
  }
};
