import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'talent',
  label: 'Talents',
  entryLabel: 'talent',
  scope: 'character',
  route: GOAL_ROUTES.talent,
  // A character with no class has no flatTalents
  list: ({ character }) => character?.flatTalents ?? [],
  key: (row) => String(row.talentId),
  name: (row) => cleanUnderscore(row.name ?? ''),
  icon: (row) => `data/UISkillIcon${row.talentId}`,
  metrics: {
    // baseLevel: the points invested; level adds the account-wide added levels on top
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.baseLevel ?? 0,
      max: (row) => realCap(row.maxLevel),
      steps: [10, 50]
    }
  }
};
