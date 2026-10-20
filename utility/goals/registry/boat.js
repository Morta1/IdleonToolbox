import { GOAL_ROUTES } from '../routes';

export default {
  system: 'boat',
  label: 'Boats',
  entryLabel: 'boat',
  scope: 'account',
  route: GOAL_ROUTES.boat,
  list: ({ account }) => account?.sailing?.boats ?? [],
  key: (row) => String(row.boatIndex),
  name: (row) => `Boat ${row.boatIndex + 1}`,
  icon: (row) => `etc/${row.rawName}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 },
    loot: { label: 'Loot level', value: (row) => row.lootLevel ?? 0 },
    speed: { label: 'Speed level', value: (row) => row.speedLevel ?? 0 }
  }
};
