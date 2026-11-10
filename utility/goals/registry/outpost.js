import { OUTPOST_RANK_NAMES, OUTPOST_UPGRADE_NAMES } from '@parsers/class-specific/royalGuardian';
import { monsterSprite } from '@utility/spriteImages';
import { GOAL_ROUTES } from '../routes';

// One metric per rank bar the outposts page shows on each card
const rankMetrics = Object.fromEntries(OUTPOST_RANK_NAMES.map((rankName, type) => [
  `rank${type}`,
  { label: `${rankName} rank`, noun: 'rank', value: (row) => row.rankBars?.[type]?.rank ?? 0 }
]));

// The three PTS upgrades of the Upgrade Outpost panel; the game caps none of them, only PTS limits them
const upgradeMetrics = Object.fromEntries(OUTPOST_UPGRADE_NAMES.map((upgradeName, index) => [
  `upgrade${index}`,
  { label: upgradeName, noun: 'level', value: (row) => row.upgrades?.[index]?.level ?? 0 }
]));

export default {
  system: 'outpost',
  label: 'Outposts',
  entryLabel: 'outpost',
  scope: 'account',
  route: GOAL_ROUTES.outpost,
  list: ({ account }) => account?.royalGuardian?.outposts ?? [],
  key: (row) => String(row.mapIndex),
  name: (row) => row.name || `Map ${row.mapIndex}`,
  // entries show their map's monster; the system and its All goals keep the outpost icon
  systemIcon: 'etc/Royal_Outpost',
  // the monster's face, as on the Outposts page cards: players know a map by its monster
  icon: (row) => (row.monsterRawName ? monsterSprite(row.monsterRawName, 'face').replace(/\.\w+$/, '') : 'etc/Royal_Outpost'),
  entryTag: (row) => [row.monsterName, row.boosted ? 'Glorified' : null].filter(Boolean).join(' · ') || null,
  metrics: {
    ...rankMetrics,
    ...upgradeMetrics,
    // the card's Glorified marker
    glorified: { label: 'Glorified', value: (row) => (row.boosted ? 1 : 0), boolean: true }
  }
};
