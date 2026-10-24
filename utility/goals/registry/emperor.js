import { GOAL_ROUTES } from '../routes';

export default {
  system: 'emperor',
  label: 'Emperor',
  entryLabel: 'emperor',
  scope: 'account',
  route: GOAL_ROUTES.emperor,
  list: ({ account }) => (account?.emperor ? [account.emperor] : []),
  key: () => 'emperor',
  name: () => 'Emperor showdown',
  // the page's own icon for its attempts cards
  icon: () => 'data/GemP45',
  metrics: {
    showdown: { label: 'Highest showdown', value: (row) => row.highestEmperorShowdown ?? 0 }
  }
};
