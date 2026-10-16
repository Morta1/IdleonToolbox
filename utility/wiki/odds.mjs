// How the wiki words a chance. An .mjs with no imports so the Node graph build (sneaking loot lines) and
// the panels (drops.js re-exports both) print odds the same way.

// toPrecision switches to exponential notation below 1e-6, and Lucky Lad off Sand Giant is
// 6.66e-9, so the drop chance rendered as "6.66e-7%". Three significant figures either way, just
// never in a notation a player has to decode. A chance short of certain never reads 100%: 0.9999 keeps
// figures until it reads 99.99%, up to six, where a rounding residue just under 1 reads 99.9999%.
const MAX_FIGURES = 6;
const SHORT_OF_CERTAIN = `${(100 - 10 ** (2 - MAX_FIGURES)).toFixed(MAX_FIGURES - 2)}%`;

export const percentLabel = (value) => {
  if (value == null || !Number.isFinite(value)) return '';
  let digits = 3;
  let text = (value * 100).toPrecision(digits);
  while (value < 1 && Number(text) >= 100 && digits < MAX_FIGURES) text = (value * 100).toPrecision(++digits);
  if (value < 1 && Number(text) >= 100) return SHORT_OF_CERTAIN;
  if (!text.includes('e')) return `${text}%`;
  const fixed = Number(text).toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
  return `${fixed}%`;
};

// "1 in 47,100" rather than "0.00213%", the way both the game and the wiki quote drop odds.
// Three significant figures, whole numbers from 1 in 10 up. Below that a whole number contradicts the
// percentage beside it: 15.9% and 16.3% both read "1 in 6", which is 16.7%. So one decimal there.
const ONE_DECIMAL_BELOW = 10;
export const oneIn = (chance) => {
  if (!(chance > 0)) return '';
  const odds = Number((1 / chance).toPrecision(3));
  const shown = odds < ONE_DECIMAL_BELOW ? Math.round(odds * 10) / 10 : Math.round(odds);
  return `1 in ${shown.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;
};

// oneIn, or nothing for a likely drop that is not certain: "1 in 1.3" says less than the 75% beside it, so
// a line that also prints the percentage says only that. The cut is where whole-number odds read "1 in 1".
const LIKELY_BELOW = 1.5;
export const oneInOrNothing = (chance) => (chance < 1 && 1 / chance < LIKELY_BELOW ? '' : oneIn(chance));

// A percentage to at most two decimals with no padding ("25%", "0.15%"), for a rate written into a sentence.
export const percentText = (value) => `${Number((100 * value).toFixed(2))}%`;
