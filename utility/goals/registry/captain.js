import { GOAL_ROUTES } from '../routes';

export default {
  system: 'captain',
  label: 'Captains',
  entryLabel: 'captain',
  scope: 'account',
  route: GOAL_ROUTES.captain,
  list: ({ account }) => account?.sailing?.captains ?? [],
  key: (row) => String(row.captainIndex),
  name: (row) => `Captain ${row.captainIndex}`,
  // an empty slot draws the type 0 portrait, as on the page
  icon: (row) => `etc/Captain_${row.captainType === -1 ? 0 : row.captainType}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
