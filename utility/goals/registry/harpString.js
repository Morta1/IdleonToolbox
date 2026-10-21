import { HARP_STRING_LETTERS, harpNoteIcon } from '@parsers/world-5/caverns/the-harp';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'harpString',
  label: 'Harp strings',
  entryLabel: 'string',
  scope: 'account',
  route: GOAL_ROUTES.harpString,
  list: ({ account }) => (account?.hole?.caverns?.theHarp?.chords ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => `${HARP_STRING_LETTERS[row.index]} string`,
  icon: (row) => harpNoteIcon(row.index),
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
