import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';

const COLOURS = { 0: 'White', 1: 'Green', 2: 'Yellow', 3: 'Blue', 4: 'Purple', 5: 'Red', 6: 'Cyan', 7: 'Teal' };

export default {
  system: 'summonUpgrade',
  label: 'Summoning upgrades',
  entryLabel: 'summoning upgrade',
  scope: 'account',
  route: GOAL_ROUTES.summonUpgrade,
  groups: {
    label: 'Colour',
    of: (row) => String(row.colour),
    names: COLOURS
  },
  // the page only draws the colours it names
  list: ({ account }) => withUniqueNames(
    Object.entries(account?.summoning?.upgrades ?? {}).filter(([colour]) => COLOURS[colour]).flatMap(([, upgrades]) => upgrades),
    (row) => cleanUnderscore(row.name ?? '')
  ),
  key: (row) => String(row.originalIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/SumUpgIc${row.originalIndex}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLvl, 9999)
    }
  }
};
