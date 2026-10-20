import { GOAL_ROUTES } from '../routes';

export default {
  system: 'dust',
  label: 'Dust',
  entryLabel: 'dust',
  scope: 'account',
  route: GOAL_ROUTES.dust,
  // the parser builds one entry per dust name, in order
  list: ({ account }) => (account?.compass?.dusts ?? []).map((dust, index) => ({ ...dust, index })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `data/Dust${row.index}_x1`,
  metrics: {
    amount: { label: 'Held', value: (row) => Number(row.value) || 0 }
  }
};
