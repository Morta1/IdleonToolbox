import { GOAL_ROUTES } from '../routes';

export default {
  system: 'menagerieJelly',
  label: 'Jellyfish',
  entryLabel: 'jellyfish',
  scope: 'account',
  route: GOAL_ROUTES.menagerieJelly,
  list: ({ account }) => (account?.menagerie?.jellies?.sideUnlocked ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => `${row.name} Jellyfish`,
  icon: (row) => `data/MenaJelly${row.index + 1}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true }
  }
};
