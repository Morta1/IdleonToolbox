import { sentence } from '../text.mjs';
import { gameTable } from '../data.mjs';

// Summoning("TomeLvReq") (the tomeLevelReq table): the account level a line needs, by its position in NinjaInfo[32]. No table, no
// level.
const levelFor = (position, data) => {
  const req = gameTable(data, 'tomeLevelReq');
  return req
    ? req.steps.reduce((sum, { perPosition, above }) => sum + perPosition * Math.max(0, position - above), req.perPosition * position) + req.base
    : null;
};

// The bar colours _event_Tome2 switches to as the line's score rises past each threshold in the tomeBars table; bronze is the colour below
// the first. A threshold with no name here is left out.
// UPKEEP: the colour names. Not extracted: the game names no colour, it only switches the bar's font (322, 323, 324, 564).
const BAR_NAMES = ['Silver bar', 'Gold bar', 'Blue bar (full)'];

// Summoning("TomePCT") (the tomePct table) scores a line by the curve its x2 names, inverted here for the quantity a given score
// needs: `power` and `log` climb with x1 as the scale, `linear` is linear to a cap, `lowerIsBetter` falls as the stat rises,
// `capped` stops at x1. The bar turns once the score reaches the threshold, so a climbing curve needs the first whole quantity
// at or past it and a falling one the last whole quantity at or below it. A threshold that lands exactly on a whole number
// (40% of 470) must not tip over it. The log curve is inverted with getLOG's own divisor (the gameLog table: ln 10
// truncated); without it that curve has no quantity.
const quantityFor = (x1, curve, pct, gameLog) => {
  const whole = (value, round) => round(Number(value.toPrecision(12)));
  if (curve?.form === 'power') { const base = pct ** (1 / curve.exponent); return whole((base * x1) / (curve.scale - base), Math.ceil); }
  if (curve?.form === 'log') return gameLog ? whole(Math.exp((gameLog.divisor * pct * x1) / (curve.scale - curve.logScale * pct)), Math.ceil) : null;
  if (curve?.form === 'linear') return whole(pct * x1, Math.ceil);
  if (curve?.form === 'lowerIsBetter') {
    const base = pct ** (1 / curve.exponent);
    return whole((curve.scale * curve.offset * x1 - curve.span * base * x1) / (curve.scale - base), Math.floor);
  }
  if (curve?.form === 'capped') { const base = pct ** (1 / curve.exponent); return whole((base * x1) / (curve.scale - base), Math.ceil); }
  return null;
};

// What a curve's score approaches, as a share of the points at a full bar: it keeps climbing past a full bar for `power` and
// `log`, and peaks at a stat of 0 for `lowerIsBetter`. `linear` and `capped` stop at the full bar.
const limitOf = (curve) => {
  if (curve?.form === 'power') return curve.scale ** curve.exponent;
  if (curve?.form === 'log') return curve.scale / curve.logScale;
  if (curve?.form === 'lowerIsBetter') return ((curve.scale * curve.offset) / curve.span) ** curve.exponent;
  return null;
};

// Quantities run to 1e62 (Most Money held), so past a billion they print as 1.34e62.
// UPKEEP: the billion switch-over matches the wiki's formatAmount, so a tome quantity reads like every other large number.
const big = (value) => (value >= 1e9 ? value.toExponential(2).replace('e+', 'e') : value.toLocaleString('en-US'));
// UPKEEP: x4 is 1 only on Highest Drop Rate Multi, whose quantity the screen prints as "Nx".
const amount = (entry, curve, value) => `${big(value)}${entry.x4 === 1 ? 'x' : ''}${curve.form === 'lowerIsBetter' ? ' or less' : ''}`;

export default {
  kind: 'tome',
  section: 'tomeData',
  // UPKEEP: keyed by table position (the save's TomeQTY index); NinjaInfo[32] is the order the Tome lists them in.
  key: (entry, index) => `Tome${index}`,
  // UPKEEP: the game pads some names with a trailing underscore, and one ends "(Tap for more info)", which only means something in game.
  name: (entry) => entry.name.replace(/_*\(Tap_for_more_info\)/, '').replace(/_+$/, ''),
  fallbackIcon: '/etc/Tome_0.png',
  // UPKEEP: row 0's info is the Tome header (# $ ~ ` placeholders), and "filler" means the game shows none.
  describe: (entry, index) => (index === 0 || entry.info === 'filler' ? null : sentence(entry.info)),
  fields: (entry, index, data) => {
    const position = (data.ninjaExtraInfo?.[32] || []).indexOf(String(index));
    const curve = gameTable(data, 'tomePct')?.[entry.x2];
    const limit = limitOf(curve);
    const gameLog = gameTable(data, 'gameLog');
    const thresholds = (gameTable(data, 'tomeBars') || []).slice(0, BAR_NAMES.length);
    const bars = thresholds.flatMap((pct, at) => {
      const quantity = quantityFor(entry.x1, curve, pct, gameLog);
      return quantity === null ? [] : [`${BAR_NAMES[at]}: ${amount(entry, curve, quantity)}`];
    });
    return [
      ...(position >= 0 ? [{ label: 'Account level needed', value: levelFor(position, data) }] : []),
      { label: 'Points at a full bar', value: entry.x3 },
      ...(limit ? [{ label: 'Most points possible', value: Math.ceil(limit * entry.x3) }] : []),
      { label: 'Quantity for each bar colour', value: bars.length ? bars : null }
    ];
  }
};
