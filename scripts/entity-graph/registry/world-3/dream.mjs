import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { sentence, spaced } from '../text.mjs';
import researchSquare from '../world-7/research-square.mjs';

// UPKEEP: equinox.ts locks every challenge from index 36 (dream #37) until Research Grid square 86 reaches level 1; re-check both numbers on a game patch.
const LOCKED_FROM = 36;
// UPKEEP: researchGridSquares[86] is Equinox_Nightmares, the square equinox.ts reads for that lock.
const UNLOCK_SQUARE = 86;

// UPKEEP: the dream table carries no Equinox upgrade id, only the name its reward text quotes ("+3 Max LV for Equinox Upgrade 'Liquidvestment'"), so the link is an exact, unique name join; zero or several matches link nothing, and a partial match never does.
const QUOTED_UPGRADE = /Max_LV.*'([^']+)'/;
const upgradeOf = (reward, data) => {
  const quoted = QUOTED_UPGRADE.exec(String(reward))?.[1];
  const matches = quoted ? (data.equinoxUpgrades || []).flatMap((upgrade, i) => (spaced(upgrade?.name) === spaced(quoted) ? [i] : [])) : [];
  return matches.length === 1 ? `equinox:Dream_Upgrade_${matches[0] + 1}` : null;
};

export default {
  kind: 'dream',
  section: 'equinoxChallenges',
  // UPKEEP: the game titles challenge i "Dream #(i + 1)" (N.js "Dream_#" + CloudsTask + 1), so a key by table position renumbers every dream after an inserted one, in game too.
  key: (entry, index) => `Dream${index + 1}`,
  name: (entry, index) => `Dream_#${index + 1}`,
  fallbackIcon: '/data/Dream_Cloud.png',
  describe: (entry) => sentence(entry.label),
  fields: (entry, index, data) => [
    linked({ label: 'Reward', value: spaced(entry.reward) }, 'raisesMaxOf', upgradeOf(entry.reward, data)),
    // A goal of 1 is a yes/no task: the sentence already says it.
    ...(Number(entry.goal) > 1 ? [{ label: 'Target', value: Number(entry.goal) }] : []),
    ...(index >= LOCKED_FROM
      ? [linked(
        { label: 'Unlocked by', value: `${spaced(data.researchGridSquares?.[UNLOCK_SQUARE]?.name)} (Research Grid)` },
        'unlockedBy',
        nodeId(researchSquare, null, UNLOCK_SQUARE)
      )]
      : [])
  ]
};
