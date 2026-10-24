import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'constellation',
  label: 'Constellations',
  entryLabel: 'constellation',
  scope: 'account',
  route: GOAL_ROUTES.constellation,
  list: ({ account }) => withUniqueNames(account?.constellations ?? [], (row) => cleanUnderscore(row.name)),
  // the parser reads the save by rawIndex, falling back to the map
  key: (row) => String(row.rawIndex ?? row.mapIndex),
  name: (row) => row.goalName,
  icon: (row) => `etc/Constellation_${row.rawIndex ?? row.mapIndex}`,
  metrics: {
    done: { label: 'Completed', value: (row) => (row.done ? 1 : 0), boolean: true }
  }
};
