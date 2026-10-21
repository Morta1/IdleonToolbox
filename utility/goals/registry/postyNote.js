import { GOAL_ROUTES } from '../routes';

export default {
  system: 'postyNote',
  label: 'Posty notes',
  entryLabel: 'posty note',
  scope: 'account',
  route: GOAL_ROUTES.postyNote,
  list: ({ account }) => account?.research?.postyNotes ?? [],
  key: (row) => String(row.index),
  name: (row) => `Posty Note #${row.index + 1}`,
  icon: (row) => `data/ResPosty${row.index}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true }
  }
};
