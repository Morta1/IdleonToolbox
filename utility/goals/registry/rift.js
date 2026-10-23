import { GOAL_ROUTES } from '../routes';

export default {
  system: 'rift',
  label: 'Rift',
  entryLabel: 'Rift',
  scope: 'account',
  route: GOAL_ROUTES.rift,
  list: ({ account }) => (account?.rift ? [account.rift] : []),
  key: () => 'rift',
  name: () => 'Rift level',
  icon: () => 'data/Mface75',
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.currentRift ?? 0,
      max: (row) => row.list?.length || null
    }
  }
};
