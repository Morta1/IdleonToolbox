import { GOAL_ROUTES } from '../routes';

export default {
  system: 'charLevel',
  label: 'Character level',
  entryLabel: 'level',
  scope: 'character',
  route: GOAL_ROUTES.charLevel,
  list: ({ character }) => (character ? [character] : []),
  key: () => 'level',
  name: () => 'Character level',
  icon: (row) => `data/ClassIcons${row.classIndex ?? 0}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
