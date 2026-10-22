import { GOAL_ROUTES } from '../routes';

const base = (row) => row.rawName.replace(/\.png$/, '');

export default {
  system: 'logBook',
  label: 'Log book',
  entryLabel: 'log book plant',
  scope: 'account',
  route: GOAL_ROUTES.logBook,
  list: ({ account }) => account?.gaming?.logBook ?? [],
  key: base,
  // GamingPlant<row letter><column>: row letter a is the first row
  name: (row) => {
    const [, letter, column] = /^GamingPlant([a-z])(\d+)$/.exec(base(row)) ?? [];
    return letter ? `Plant ${letter.charCodeAt(0) - 96}-${Number(column) + 1}` : base(row);
  },
  icon: (row) => `data/${base(row)}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' },
    crowned: { label: 'Crowned', value: (row) => (row.crowned ? 1 : 0), boolean: true }
  }
};
