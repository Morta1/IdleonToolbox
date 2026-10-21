import { GOAL_ROUTES } from '../routes';

export default {
  system: 'ninja',
  label: 'Ninjas',
  entryLabel: 'ninja',
  scope: 'character',
  route: GOAL_ROUTES.ninja,
  // the Inventory tab card of this character: its floor and Sneaking level
  list: ({ account, character }) => {
    const player = account?.sneaking?.players?.[character?.playerId];
    return player ? [{ floor: player.floor, level: character?.skillsInfo?.sneaking?.level }] : [];
  },
  key: () => 'ninja',
  name: () => 'Ninja',
  icon: () => 'data/ClassIcons58',
  metrics: {
    floor: { label: 'Floor', value: (row) => (Number.isFinite(row.floor) ? row.floor + 1 : 0) },
    level: { label: 'Sneaking level', value: (row) => row.level ?? 0 }
  }
};
