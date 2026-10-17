import { gameTable } from '../data.mjs';
import { tidy } from '../text.mjs';

// UPKEEP: research[56] names the unlocks and research[62] holds the tooltip of each name marked 膛. Not extracted: only the
// Menagerie panel's unnamed draw event (`_event_`) reads them, which no locator may anchor on.
export const UNLOCK_NAMES = 56;
const TOOLTIPS = 62;
const TOOLTIP_MARK = '膛';
// UPKEEP: unlock 6's "1 in $ chance" is an account readout, max(1, 1 / (Drop Rarity x OmegaArcBallChance)) (N.js:124031); the
// cut keeps the sentence.
const READOUT = /,_1_in_\$_chance/;

// The menagerieCost table, MenagerieStuff Cost arm 1 (N.js:72954): (base + t^power) x max(floor, start + (t / divisor) x slope)^t.
const unlockCost = (t, price) => (price.base + Math.pow(t, price.power))
  * Math.pow(Math.max(price.floor, price.start + (t / price.divisor) * price.slope), t);

// The menagerieRankReq table, MenagerieStuff UpgUnlocked (N.js:72950): rank R shows min(first, R) + floor(max(0, R - first) /
// every) entries, so entry t first shows at the rank below.
export const rankNeeded = (t, req) => (t < req.first ? t + 1 : req.first + req.every * (t - req.first + 1));

// The unlock's own name, as its page title and in the fields that name it.
export const unlockName = (name) => tidy(String(name ?? '').replace(READOUT, ''));

export default {
  kind: 'menagerieunlock',
  section: (data) => (data.research[UNLOCK_NAMES] || []).map((name) => ({ name: unlockName(name), marked: String(name).includes(TOOLTIP_MARK) })),
  key: (entry, index) => `MenaUnlock${index}`,
  icon: (entry, index) => `/data/MenaIconO${index}.png`,
  fallbackIcon: '/data/LumiJel.png',
  // A name with no 膛 has no tooltip; its row in research[62] is a "_" placeholder.
  describe: (entry, index, data) => (entry.marked ? data.research[TOOLTIPS]?.[index] ?? null : null),
  fields: (entry, index, data) => {
    const price = gameTable(data, 'menagerieCost')?.unlock;
    const req = gameTable(data, 'menagerieRankReq')?.unlocks;
    return [
      ...(price ? [{ label: 'Unlock cost', value: unlockCost(index, price), format: 'cost', currency: 'Lumi', currencyIcon: '/etc/Lumi.png' }] : []),
      ...(req ? [{ label: 'Menagerie Rank needed', value: rankNeeded(index, req) }] : [])
    ];
  }
};
