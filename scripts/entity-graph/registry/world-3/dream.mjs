import { sentence, spaced } from '../text.mjs';

// UPKEEP: equinox.ts locks every challenge from index 36 (dream #37) until Research Grid square 86 reaches level 1; re-check both numbers on a game patch.
const LOCKED_FROM = 36;
// UPKEEP: researchGridSquares[86] is Equinox_Nightmares, the square equinox.ts reads for that lock.
const UNLOCK_SQUARE = 86;

export default {
  kind: 'dream',
  section: 'equinoxChallenges',
  // UPKEEP: the game titles challenge i "Dream #(i + 1)" (N.js "Dream_#" + CloudsTask + 1), so a key by table position renumbers every dream after an inserted one, in game too.
  key: (entry, index) => `Dream${index + 1}`,
  name: (entry, index) => `Dream_#${index + 1}`,
  fallbackIcon: '/data/Dream_Cloud.png',
  describe: (entry) => sentence(entry.label),
  fields: (entry, index, data) => [
    { label: 'Reward', value: spaced(entry.reward) },
    // A goal of 1 is a yes/no task: the sentence already says it.
    ...(Number(entry.goal) > 1 ? [{ label: 'Target', value: Number(entry.goal) }] : []),
    ...(index >= LOCKED_FROM ? [{ label: 'Unlocked by', value: `${spaced(data.researchGridSquares?.[UNLOCK_SQUARE]?.name)} (Research Grid)` }] : [])
  ]
};
