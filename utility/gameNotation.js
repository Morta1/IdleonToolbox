import { gameNotation } from '@website-data';
import { commaNotation, notateNumber } from '@utility/helpers';

// Numbers board, lane A: a number the game shows, in the format the game's own call for that stat uses. z-processing
// reads the rules from N.js (analysis/facts/gameNotation.js) into website-data's gameNotation, keyed
// `<Block>.<Key>` after the customBlock call the game prints (Sailing.LootMulti). Kept out of helpers.js, which
// imports no game data.

// A rule is a mode, or a size switch [mode, threshold, mode]: the second mode once the value is past the threshold.
export const modeFor = (rule, value) => (Array.isArray(rule) ? (value > rule[1] ? rule[2] : rule[0]) : rule);

// A stat with no rule (the game stopped printing it, or a typo) gets Big, the game's most common mode. The game draws
// units outside its notation (its # glyph is the x), so the caller adds them.
export const formatGame = (value, key) => {
  if (value == null || Number.isNaN(value)) return '-';
  const magnitude = Math.abs(value);
  const mode = modeFor(gameNotation?.[key] ?? 'Big', magnitude);
  const text = String(mode === 'Comma' ? commaNotation(magnitude) : notateNumber(magnitude, mode));
  return value < 0 ? `-${text}` : text;
};
