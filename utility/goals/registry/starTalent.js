import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'starTalent',
  label: 'Star talents',
  entryLabel: 'star talent',
  scope: 'character',
  route: GOAL_ROUTES.starTalent,
  list: ({ character }) => character?.flatStarTalents ?? [],
  key: (row) => String(row.talentId),
  name: (row) => cleanUnderscore(row.name ?? ''),
  icon: (row) => `data/UISkillIcon${row.talentId}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      // -1 when the save has no max for it
      max: (row) => realCap(row.maxLevel),
      steps: [10, 50]
    }
  }
};
