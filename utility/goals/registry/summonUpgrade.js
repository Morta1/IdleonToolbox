import { realCap } from '../caps';
import { SUMMONING_COLOURS as COLOURS } from '@parsers/world-6/summoning';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';


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
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLvl, 9999)
    }
  }
};
