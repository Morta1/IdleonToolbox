// The key's own file, not the @website-data barrel: the barrel builds itemsArray when it loads, so importing it
// ships every table to any page that prints a Num (the wiki's included).
import gameNotation from '../data/website-data/gameNotation.json';
import { cleanUnderscore, commaNotation, formatNum, fullDigits, gameFill, getBitIndex, notateNumber, SHORT_FROM } from '@utility/helpers';

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

// A stat with no rule (the game stopped printing it, or a typo) gets Big, the game's most common mode. The game draws
// units outside its notation (its # glyph is the x), so the caller adds them. ruleValue: the number whose size picks
// the mode, where the game switches a pair on one side (Sushi's knowledge "xp/req" on the requirement). whole: a cost,
// a requirement or a count, as the game prints it (notes above formatNum).
export const formatGame = (value, key, { ruleValue = value, whole = false } = {}) => {
  if (value == null || Number.isNaN(value)) return '-';
  return gameFill(value, modeFor(gameNotation?.[key] ?? 'Big', Math.abs(ruleValue ?? value)), { whole });
};

// The game's GamingUpg tooltip (N.js, the Superbits screen) fills a superbit's `{` with its total in that superbit's
// own mode: NotateNumber Big or Smaller, CommaNotation, or plain rounding. Only these superbits have a `{`.
const SUPERBIT_FILLS = {
  0: 'Big', 12: 'Round', 24: 'Smaller', 26: 'Smaller', 28: 'Round', 32: 'Smaller', 38: 'Comma', 42: 'Round', 45: 'Round',
  47: 'Floor', 55: 'Smaller'
};
export const superbitFill = (index, total) => gameFill(total ?? 0, SUPERBIT_FILLS[index] ?? 'Big');

// Bits read in the game's Bits notation wherever they show: every Gaming cost rule is Bits (FertilizerUpgCosts,
// ImportItemCOST, SuperbitCost, MutateUpgCosts), so the balance and the costs paid in bits elsewhere (Divinity's
// blessings, the Bell's rings, Menagerie missions) take the same rule.
export const formatBits = (value) => formatGame(value, 'GamingStatType.SuperbitCost');
// The notation divides by 1e18 per tier, so a bits amount reads only beside its own tier's sprite
export const bitsIcon = (value) => `etc/Bits_${getBitIndex(value ?? 0)}.png`;

// Lane B per system (3a Decision 10): a system whose screens print every keyless amount in one mode, from a live log
// of those screens (the Numbers board's Sailing log: Big for all 12 numbers). Amounts and rates only: a multiplier or
// a percent keeps its kind. Another system joins with its own log. An amount here is a whole thing (treasure, a cost, a
// distance), so it stays whole; a rate shows its decimals.
export const SYSTEM_MODES = { Sailing: 'Big' };

export const formatSystem = (value, kind = 'amount', system, options = {}) => {
  const mode = SYSTEM_MODES[system];
  if (!mode || (kind !== 'amount' && kind !== 'rate')) return formatNum(value, kind, options);
  if (value == null || Number.isNaN(value)) return '-';
  const text = formatGame(value, mode, { whole: kind === 'amount' });
  return kind === 'rate' ? `${value > 0 ? '+' : ''}${text}/${options.per ?? 'hr'}` : text;
};

// The game's two hand fills, written where a panel prints a bonus into its sentence.
// `{` in the land rank database (N.js:108905): Math.round(100 * x) / 100
export const fillRound = (x) => Math.round(100 * x) / 100;
// `{` and `}` on an Advice Fish upgrade (N.js:218986): Math.ceil(100 * x) / 100
export const fillCeil = (x) => Math.ceil(100 * x) / 100;

// The Temple panel's amounts (N.js:113876): millions past 1e7, billions past billionsFrom (1e13 for the torch count, 1e10
// for costs), capped at 999999B. Each part is CommaNotation of the scaled value, which a gameNotation mode can't say.
export const templeAmount = (value, billionsFrom) => {
  if (value > 999999999999999.9) return '999999B';
  if (value > billionsFrom) return `${commaNotation(value / 1e9)}B`;
  if (value > 9999999.9) return `${commaNotation(value / 1e6)}M`;
  return commaNotation(value);
};

// The game's Cash multi fill (N.js, the stat screen): Big past 1e16, its own B past 1e10 and M past 1e7, MultiplierInfo under.
export const cashMultiText = (value) => (value > 1e16 || value <= 1e7 ? formatGame(value, 'ArbitraryCode.MonsterCash')
  : value > 1e10 ? `${Math.floor(value / 1e8) / 10}B` : `${Math.floor(value / 1e5) / 10}M`);

// The game's Minor Link Bonus line (N.js, the Divinity panel): Arctis counts whole talent levels (Math.ceil), so its
// stays whole; every other god's is a bonus, with its decimals.
export const minorBonusText = (bonus, isArctis) => (isArctis ? String(Math.ceil(bonus)) : formatGame(bonus, 'Divinity.DivMinorBonus'));

// A Tome entry's quantity, the game's fill: Big past 1e9 on a log curve (x2 1), two decimals on an x4 entry, commas
// otherwise. One rule for the Tome's Overview and Rankings. The player's own quantity takes the site's rule below 1M;
// whole is a quantity an entry asks for, which keeps the game's fill.
export const tomeQuantity = ({ x2, x4 } = {}, quantity, { whole = false } = {}) => {
  if (!whole && SHORT_FROM > quantity) return fullDigits(quantity);
  if (quantity > 1e9 && x2 === 1) return notateNumber(quantity, 'Big');
  return x4 === 1 ? String(Math.round(100 * quantity) / 100) : commaNotation(quantity);
};

// The game's prayer screen fill, Math.round(x * max(1, 1 + (lv - 1) / 10)) (N.js, the prayer panel): the game's bonus
// is this whole number, so there is no fraction to show, and a prayer at Lv 0 reads its first level's numbers
export const prayerValue = (base, level) => Math.round((base ?? 0) * Math.max(1, 1 + ((level ?? 0) - 1) / 10));
export const fillPrayer = (text, value) => cleanUnderscore(text ?? '').replace('{', formatNum(value));

// The game's vote and meritocracy lines (N.js, the ballot screen): { is the bonus, } is 1 + bonus / 100 in
// MultiplierInfo, the x left to the sentence.
export const fillVoteText = (description, bonus) => (description ?? '')
  .replace('{', fullDigits(bonus ?? 0))
  .replace('}', notateNumber(1 + (bonus ?? 0) / 100, 'MultiplierInfo'));

// A meal's bonus: the rule, then the game's fill from 1M up (parsers/world-4/cooking.ts formatMealBonus: commas, Big from 1e7)
export const mealBonusText = (value) => (SHORT_FROM > value ? fullDigits(value) : 1e7 > value ? commaNotation(value) : notateNumber(value, 'Big'));

// A bonus in a description's "{" (stamps, bubbles, vials, sigils and the like): the rule, whole from 1M up as the game
// rounds it there. The sign is the description's.
export const gameBonusText = (value) => {
  const v = Number(value) || 0;
  return SHORT_FROM <= Math.abs(v) ? String(Math.round(v)) : `${v < 0 ? '-' : ''}${fullDigits(Math.abs(v))}`;
};
