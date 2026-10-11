// game: ArbitraryCode("HitChancePCT"). Data-free on purpose: parsers/damage.ts, the wiki infobox
// and the entity-graph builder (plain node) all import it, and the wiki must never pull in a module
// that sits next to a @website-data import.
//
// The game picks the curve from the target's Type: "Monster" uses the steep one, every other Type
// (Ore, Tree, Fish, Bug, which covers mining, choppin, fishing, catching, spelunking and the
// Cooking/Lab/Divinity AFK targets) uses a gentler one that starts at a quarter of the Defence.
export const HIT_CURVE = Object.freeze({ MONSTER: 'monster', RESOURCE: 'resource' });

export const hitCurveOf = (type) => type === 'Monster' ? HIT_CURVE.MONSTER : HIT_CURVE.RESOURCE;

// The smallest accuracy / Defence ratio that gives any hit chance at all.
const RATIO_GATE = { [HIT_CURVE.MONSTER]: 0.5, [HIT_CURVE.RESOURCE]: 0.25 };

// Same operations in the same order as the game, so float rounding lands where the game's does:
// exactly half Defence on a monster is 4.999...% and floors to 4, not 5.
export const hitChanceFromRatio = (ratio, curve) => {
  if (!(RATIO_GATE[curve] <= ratio)) return 0;
  return curve === HIT_CURVE.MONSTER
    ? Math.floor(Math.min(100 * (0.95 * ratio - 0.425), 100))
    : Math.floor(Math.min(6 * (ratio - 0.174) / (ratio - 0.17 + 9.04) * 100, 100));
};

export const hitChance = (accuracy, defence, curve) => hitChanceFromRatio(accuracy / defence, curve);

// The curves solved for the ratio, before floor():
//   monster:  100 * (0.95r - 0.425) = h        ->  r = (h / 100 + 0.425) / 0.95
//   resource: 600 * (r - 0.174) / (r + 8.87) = h  ->  r = (104.4 + 8.87h) / (600 - h)
// 5% lands on the gate for both (0.5 and 0.25), 100% at 1.5 and 1.9828 times Defence.
const ratioFor = (percent, curve) => {
  const exact = curve === HIT_CURVE.MONSTER
    ? (percent / 100 + 0.425) / 0.95
    : (104.4 + 8.87 * percent) / (600 - percent);
  return Math.max(RATIO_GATE[curve], exact);
};

// Past 2^53 an integer step no longer moves the number, so the nudge below stops there.
const MAX_NUDGES = 16;

// The smallest whole accuracy whose hit chance, as the game computes and floors it, is at least
// `percent`. The closed form gets within one; the forward formula settles the float edge cases.
export const accuracyForHitChance = (defence, percent, curve) => {
  if (!(defence > 0)) return null;
  if (percent <= 0) return 0;
  if (percent > 100) return Infinity;
  const reaches = (accuracy) => hitChance(accuracy, defence, curve) >= percent;
  let accuracy = Math.ceil(defence * ratioFor(percent, curve));
  for (let i = 0; i < MAX_NUDGES && !reaches(accuracy) && accuracy + 1 !== accuracy; i++) accuracy++;
  for (let i = 0; i < MAX_NUDGES && accuracy - 1 !== accuracy && reaches(accuracy - 1); i++) accuracy--;
  return accuracy;
};
