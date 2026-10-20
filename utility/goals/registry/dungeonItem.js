import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'dungeonItem',
  label: 'Dungeon items',
  entryLabel: 'dungeon item',
  scope: 'account',
  route: GOAL_ROUTES.dungeonItem,
  list: ({ account }) => account?.dungeons?.rngItems ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/DungItems${row.index}`,
  metrics: {
    // the game keeps -1 for an item you have not found yet; the page shows 0
    level: { label: 'Level', value: (row) => Math.max(0, row.level ?? 0), max: (row) => realCap(row.maxLevel) }
  }
};
