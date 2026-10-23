import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';
import { isGlobalSkill } from '../../consts';

export default {
  system: 'skill',
  label: 'Skills',
  entryLabel: 'skill',
  scope: 'character',
  route: GOAL_ROUTES.skill,
  // 'character' is the class level riding in skillsInfo; the skills page skips it too
  list: ({ character }) => Object.entries(character?.skillsInfo ?? {})
    .filter(([skillName]) => skillName !== 'character')
    .map(([skillName, info]) => ({ ...info, skillName })),
  key: (row) => row.skillName,
  name: (row) => capitalizeFirst(row.skillName),
  icon: (row) => `data/${row.icon}`,
  // A global skill has one level on every character, so its goal is the account's
  globalKey: isGlobalSkill,
  entryTag: (row) => (isGlobalSkill(row.skillName) ? 'Global' : null),
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
