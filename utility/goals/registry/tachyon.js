import { GOAL_ROUTES } from '../routes';

export default {
  system: 'tachyon',
  label: 'Tachyons',
  entryLabel: 'tachyon',
  scope: 'account',
  route: GOAL_ROUTES.tachyon,
  // the parser builds one entry per tachyon color, in order
  list: ({ account }) => (account?.tesseract?.tachyons ?? []).map((tachyon, index) => ({ ...tachyon, index })),
  key: (row) => String(row.index),
  name: (row) => `${row.name} tachyon`,
  icon: (row) => `data/Tach${row.index}_x1`,
  metrics: {
    amount: { label: 'Held', value: (row) => Number(row.value) || 0 }
  }
};
