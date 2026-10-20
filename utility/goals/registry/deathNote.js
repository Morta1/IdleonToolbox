import { DEATH_NOTE_RANKS, getDeathNoteRank, MINI_BOSS_DEATH_NOTE_RANKS } from '@parsers/world-3/deathNote';
import { cleanUnderscore, kFormatter, worlds } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const MINI_BOSSES = 'miniBosses';
const ranksFor = (row) => (row.world === MINI_BOSSES ? MINI_BOSS_DEATH_NOTE_RANKS : DEATH_NOTE_RANKS);
const thousands = (kills) => kFormatter(kills, 0).toUpperCase();

// One rung per kill threshold met. Mini bosses climb their own, much lower table in the same number of steps.
const TIERS = ['None', ...DEATH_NOTE_RANKS.map(([kills], i) =>
  `${thousands(kills)} kills (mini boss ${thousands(MINI_BOSS_DEATH_NOTE_RANKS[i][0])})`)];

// The skull the page draws for a rank's points
const skullIcon = (points) => {
  if (points > 10) return 'etc/EclipseSkull';
  const number = points - 1 - Math.floor(points / 7) - 2 * Math.floor(points / 10);
  return `data/StatusSkull${Math.max(0, number)}`;
};

export default {
  system: 'deathNote',
  label: 'Death Note',
  entryLabel: 'monster',
  scope: 'account',
  route: GOAL_ROUTES.deathNote,
  groups: {
    label: 'Death Note',
    of: (row) => row.world,
    names: { ...worlds, [MINI_BOSSES]: 'Minibosses' }
  },
  list: ({ account }) => Object.entries(account?.deathNote ?? {}).flatMap(([world, { mobs }]) =>
    (mobs ?? []).map((mob) => ({
      ...mob,
      world,
      points: getDeathNoteRank(account, mob.kills ?? 0, world === MINI_BOSSES)
    }))),
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName ?? row.rawName),
  icon: (row) => skullIcon(row.points),
  metrics: {
    kills: {
      label: 'Kills',
      value: (row) => row.kills ?? 0,
      steps: [100000, 1000000]
    },
    rank: {
      label: 'Rank',
      value: (row) => ranksFor(row).filter(([kills]) => (row.kills ?? 0) >= kills).length,
      tiers: TIERS
    }
  }
};
