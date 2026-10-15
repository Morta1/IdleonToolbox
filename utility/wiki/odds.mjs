// How the wiki words a chance. An .mjs with no imports so the Node graph build (sneaking loot lines) and
// the panels (drops.js re-exports both) print odds the same way.

// toPrecision switches to exponential notation below 1e-6, and Lucky Lad off Sand Giant is
// 6.66e-9, so the drop chance rendered as "6.66e-7%". Three significant figures either way, just
// never in a notation a player has to decode. A chance short of certain never reads 100%: 0.9999 keeps
// figures until it reads 99.99%.
export const percentLabel = (value) => {
  if (value == null || !Number.isFinite(value)) return '';
  let digits = 3;
  let text = (value * 100).toPrecision(digits);
  while (value < 1 && Number(text) >= 100 && digits < 15) text = (value * 100).toPrecision(++digits);
  if (!text.includes('e')) return `${text}%`;
  const fixed = Number(text).toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
  return `${fixed}%`;
};

// "1 in 47,100" rather than "0.00213%", the way both the game and the wiki quote drop odds.
// Three significant figures and then whole numbers, which is what idleon.wiki prints: a 14% drop
// reads "1 in 7", not "1 in 7.14".
export const oneIn = (chance) => (chance > 0
  ? `1 in ${Math.round(Number((1 / chance).toPrecision(3))).toLocaleString('en-US')}`
  : '');

// oneIn, or nothing where it would round to "1 in 1" for a chance that is not certain: a 75% roll is not
// "1 in 1", so a line that also prints the percentage says only that.
export const oneInOrNothing = (chance) => {
  const odds = oneIn(chance);
  return odds === '1 in 1' && chance < 1 ? '' : odds;
};

// A percentage to at most two decimals with no padding ("25%", "0.15%"), for a rate written into a sentence.
export const percentText = (value) => `${Number((100 * value).toFixed(2))}%`;
