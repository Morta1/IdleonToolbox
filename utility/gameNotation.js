// The key's own file, not the @website-data barrel: the barrel builds itemsArray when it loads, so importing it
// ships every table to any page that prints a Num (the wiki's included).
import gameNotation from '../data/website-data/gameNotation.json';
import { commaNotation, formatNum, getBitIndex, notateNumber } from '@utility/helpers';

// Numbers board, lane A: a number the game shows, in the format the game's own call for that stat uses. z-processing
// reads the rules from N.js (analysis/facts/gameNotation.js) into website-data's gameNotation, keyed
// `<Block>.<Key>` after the customBlock call the game prints (Sailing.LootMulti). Kept out of helpers.js, which
// imports no game data.

// A rule is a mode, or a size switch [mode, threshold, mode, threshold, mode ...]: each mode once the value is past
// the threshold before it (the game tests `threshold < x`, so the threshold itself keeps the mode before).
export const modeFor = (rule, value) => {
  if (!Array.isArray(rule)) return rule;
  let mode = rule[0];
  for (let index = 1; index < rule.length; index += 2) if (value > rule[index]) mode = rule[index + 1];
  return mode;
};

// The modes z-processing names for the game's plain arithmetic fills (analysis/facts/gameNotation.js): `Math.floor(x)`,
// `Math.floor(10 * x) / 10`, `Math.round(x)`, `Math.ceil(x)`. A caller adds any offset the game adds (attack speed's 100).
const PLAIN = {
  Floor: (value) => String(Math.floor(value)),
  Tenths: (value) => String(Math.floor(10 * value) / 10),
  Round: (value) => String(Math.round(value)),
  Ceil: (value) => String(Math.ceil(value))
};

// A value in one mode, the sign drawn outside the notation
const inMode = (value, mode) => {
  const magnitude = Math.abs(value);
  const text = PLAIN[mode] ? PLAIN[mode](magnitude) : String(mode === 'Comma' ? commaNotation(magnitude) : notateNumber(magnitude, mode));
  return value < 0 ? `-${text}` : text;
};

// A stat with no rule (the game stopped printing it, or a typo) gets Big, the game's most common mode. The game draws
// units outside its notation (its # glyph is the x), so the caller adds them. ruleValue: the number whose size picks
// the mode, where the game switches a pair on one side (Sushi's knowledge "xp/req" on the requirement).
export const formatGame = (value, key, ruleValue = value) => {
  if (value == null || Number.isNaN(value)) return '-';
  return inMode(value, modeFor(gameNotation?.[key] ?? 'Big', Math.abs(ruleValue ?? value)));
};

// The game's GamingUpg tooltip (N.js, the Superbits screen) fills a superbit's `{` with its total in that superbit's
// own mode: NotateNumber Big or Smaller, CommaNotation, or plain rounding. Only these superbits have a `{`.
const SUPERBIT_FILLS = {
  0: 'Big', 12: 'Round', 24: 'Smaller', 26: 'Smaller', 28: 'Round', 32: 'Smaller', 38: 'Comma', 42: 'Round', 45: 'Round',
  47: 'Floor', 55: 'Smaller'
};
export const superbitFill = (index, total) => inMode(total ?? 0, SUPERBIT_FILLS[index] ?? 'Big');

// Bits read in the game's Bits notation wherever they show: every Gaming cost rule is Bits (FertilizerUpgCosts,
// ImportItemCOST, SuperbitCost, MutateUpgCosts), so the balance and the costs paid in bits elsewhere (Divinity's
// blessings, the Bell's rings, Menagerie missions) take the same rule.
export const formatBits = (value) => formatGame(value, 'GamingStatType.SuperbitCost');
// The notation divides by 1e18 per tier, so a bits amount reads only beside its own tier's sprite
export const bitsIcon = (value) => `etc/Bits_${getBitIndex(value ?? 0)}.png`;

// Lane B per system (3a Decision 10): a system whose screens print every keyless amount in one mode, from a live log
// of those screens (the Numbers board's Sailing log: Big for all 12 numbers). Amounts and rates only: a multiplier or
// a percent keeps its kind. Another system joins with its own log.
export const SYSTEM_MODES = { Sailing: 'Big' };

export const formatSystem = (value, kind = 'amount', system, options = {}) => {
  const mode = SYSTEM_MODES[system];
  if (!mode || (kind !== 'amount' && kind !== 'rate')) return formatNum(value, kind, options);
  if (value == null || Number.isNaN(value)) return '-';
  const text = formatGame(value, mode);
  return kind === 'rate' ? `${value > 0 ? '+' : ''}${text}/${options.per ?? 'hr'}` : text;
};

// The game's Minor Link Bonus line (N.js, the Divinity panel): Arctis counts whole talent levels (Math.ceil), every
// other god floors to a tenth.
export const minorBonusText = (bonus, isArctis) => (isArctis ? String(Math.ceil(bonus)) : formatGame(bonus, 'Divinity.DivMinorBonus'));

// A Tome entry's quantity, the game's fill: Big past 1e9 on a log curve (x2 1), two decimals on an x4 entry, commas
// otherwise. One rule for the Tome's Overview and Rankings.
export const tomeQuantity = ({ x2, x4 } = {}, quantity) => (quantity > 1e9 && x2 === 1
  ? notateNumber(quantity, 'Big')
  : x4 === 1 ? String(Math.round(100 * quantity) / 100) : commaNotation(quantity));

// The game's vote and meritocracy lines (N.js, the ballot screen): { is the bonus rounded to a tenth, } is
// 1 + bonus / 100 in MultiplierInfo, the x left to the sentence.
export const fillVoteText = (description, bonus) => (description ?? '')
  .replace('{', String(Math.round(10 * (bonus ?? 0)) / 10))
  .replace('}', notateNumber(1 + (bonus ?? 0) / 100, 'MultiplierInfo'));
