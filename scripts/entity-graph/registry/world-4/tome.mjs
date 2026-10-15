import { sentence } from '../text.mjs';
import { gameTable } from '../data.mjs';

// UPKEEP: Summoning("TomeLvReq") (readable Summoning.js:414): the account level a line needs, by its position in NinjaInfo[32].
const levelFor = (position) => 40 * position + 5 * Math.max(0, position - 35) + 10 * Math.max(0, position - 60)
  + 10 * Math.max(0, position - 80) + 15 * Math.max(0, position - 100) + 350;

// UPKEEP: _event_Tome2 turns the bar silver at 40% of the line's points, gold at 75% and blue at 99.9%; bronze is the colour below silver.
const BARS = [['Silver bar', 0.4], ['Gold bar', 0.75], ['Blue bar (full)', 0.999]];

// UPKEEP: TomePCT (readable Summoning.js:440-466) scores a line by its x2 curve, inverted here for the quantity a given score needs. 0 and 1 climb with x1 as the scale, 2 is linear to a cap, 3 falls as the stat rises, 4 stops at x1.
const LOWER_IS_BETTER = 3;

// The bar turns once the score reaches the threshold, so a climbing curve needs the first whole quantity at or past it and a falling
// one the last whole quantity at or below it. A threshold that lands exactly on a whole number (40% of 470) must not tip over it.
// Curve 1 is a getLOG curve, inverted with getLOG's own divisor (wikiTables.gameLog: ln 10 truncated); without
// it that curve has no quantity.
const quantityFor = (x1, curve, pct, gameLog) => {
  const whole = (value, round) => round(Number(value.toPrecision(12)));
  if (curve === 0) { const base = pct ** (1 / 0.7); return whole((base * x1) / (1.7 - base), Math.ceil); }
  if (curve === 1) return gameLog ? whole(Math.exp((gameLog.divisor * pct * x1) / (2.4 - 2 * pct)), Math.ceil) : null;
  if (curve === 2) return whole(pct * x1, Math.ceil);
  if (curve === LOWER_IS_BETTER) { const base = pct ** 0.2; return whole((7.2 * x1 - 7 * base * x1) / (1.2 - base), Math.floor); }
  if (curve === 4) { const base = pct ** (1 / 0.7); return whole((base * x1) / (2 - base), Math.ceil); }
  return null;
};

// What each curve's score approaches, as a share of the points at a full bar: it keeps climbing past a full bar for 0 and 1, and
// peaks at a stat of 0 for 3. Curves 2 and 4 stop at the full bar.
// UPKEEP: these are TomePCT's own constants (1.7 and the 0.7 power, the 2.4 / 2 ratio, 1.2 and 7 over 7.2 to the 5th); re-check them with the curves.
const LIMIT = { 0: 1.7 ** 0.7, 1: 1.2, 3: (7.2 / 7) ** 5 };

// Quantities run to 1e62 (Most Money held), so past a billion they print as 1.34e62.
// UPKEEP: the billion switch-over matches the wiki's formatAmount, so a tome quantity reads like every other large number.
const big = (value) => (value >= 1e9 ? value.toExponential(2).replace('e+', 'e') : value.toLocaleString('en-US'));
// UPKEEP: x4 is 1 only on Highest Drop Rate Multi, whose quantity the screen prints as "Nx".
const amount = (entry, value) => `${big(value)}${entry.x4 === 1 ? 'x' : ''}${entry.x2 === LOWER_IS_BETTER ? ' or less' : ''}`;

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
    const limit = LIMIT[entry.x2];
    const gameLog = gameTable(data, 'gameLog');
    const bars = BARS.flatMap(([bar, pct]) => {
      const quantity = quantityFor(entry.x1, entry.x2, pct, gameLog);
      return quantity === null ? [] : [`${bar}: ${amount(entry, quantity)}`];
    });
    return [
      ...(position >= 0 ? [{ label: 'Account level needed', value: levelFor(position) }] : []),
      { label: 'Points at a full bar', value: entry.x3 },
      ...(limit ? [{ label: 'Most points possible', value: Math.ceil(limit * entry.x3) }] : []),
      { label: 'Quantity for each bar colour', value: bars.length ? bars : null }
    ];
  }
};
