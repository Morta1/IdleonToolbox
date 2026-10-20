import { FLURBO_UPGRADE_MAX_LEVEL, INSIDE_UPGRADE_MAX_LEVEL } from '@parsers/dungeons';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const LISTS = {
  inside: { label: 'Dungeon', icon: 'data/DungCredits1', maxLevel: INSIDE_UPGRADE_MAX_LEVEL },
  flurbo: { label: 'Flurbo', icon: 'data/DungCredits2', maxLevel: FLURBO_UPGRADE_MAX_LEVEL }
};

export default {
  system: 'dungeonUpgrade',
  label: 'Dungeon upgrades',
  entryLabel: 'dungeon upgrade',
  scope: 'account',
  route: GOAL_ROUTES.dungeonUpgrade,
  list: ({ account }) => [
    ...(account?.dungeons?.insideUpgrades ?? []).map((upgrade) => ({ ...upgrade, list: 'inside' })),
    ...(account?.dungeons?.upgrades ?? []).map((upgrade) => ({ ...upgrade, list: 'flurbo' }))
  ],
  key: (row) => `${row.list}:${row.index}`,
  name: (row) => `${LISTS[row.list].label}: ${cleanUnderscore(row.effect)}`,
  // the page draws no picture per upgrade: the credit icon of its list, as in the header
  icon: (row) => LISTS[row.list].icon,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0, max: (row) => LISTS[row.list].maxLevel }
  }
};
