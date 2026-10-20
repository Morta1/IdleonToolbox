import { GOAL_ROUTES } from '../routes';

export default {
  system: 'kitchen',
  label: 'Kitchens',
  entryLabel: 'kitchen',
  scope: 'account',
  route: GOAL_ROUTES.kitchen,
  list: ({ account }) => account?.cooking?.kitchens ?? [],
  key: (row) => String(row.kitchenIndex),
  name: (row) => `Kitchen ${row.kitchenIndex + 1}`,
  // the page draws no picture per kitchen: the Cooking page's own icon
  icon: () => 'data/ClassIcons51',
  metrics: {
    speed: { label: 'Speed', value: (row) => row.speedLv ?? 0, steps: [10, 50] },
    fire: { label: 'Fire', value: (row) => row.fireLv ?? 0, steps: [10, 50] },
    luck: { label: 'Luck', value: (row) => row.luckLv ?? 0, steps: [10, 50] }
  }
};
