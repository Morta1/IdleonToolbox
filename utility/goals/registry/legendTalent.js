import { LEGEND_TALENT_MAX_LEVEL_GROUPS } from '@parsers/world-7/legendTalents';
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

const NO_FEVER = 'none';

export default {
  system: 'legendTalent',
  label: 'Legend talents',
  entryLabel: 'legend talent',
  scope: 'account',
  route: GOAL_ROUTES.legendTalent,
  // the page's colour filter: the Legendary Fever square that raises the talent's max level
  groups: {
    label: 'Colour',
    of: (row) => row.fever?.color ?? NO_FEVER,
    names: {
      ...Object.fromEntries(LEGEND_TALENT_MAX_LEVEL_GROUPS.map(({ color }) => [color, `${color} Fever`])),
      [NO_FEVER]: 'No fever'
    }
  },
  // the page sorts by display index and drops the filler rows; originalIndex is the game's talent index
  list: ({ account }) => withUniqueNames(account?.legendTalents?.talents ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.originalIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/LegendTalentIcon${row.index}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
