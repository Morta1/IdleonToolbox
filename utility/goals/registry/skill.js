import { GOAL_ROUTES } from '../routes';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

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
  name: (row) => capitalize(row.skillName),
  icon: (row) => `data/${row.icon}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
