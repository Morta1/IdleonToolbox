// How the wiki words a chance. An .mjs with no imports so the Node graph build (sneaking loot lines) and
// the panels (drops.js re-exports both) print odds the same way.

// toPrecision switches to exponential notation below 1e-6, and Lucky Lad off Sand Giant is
// 6.66e-9, so the drop chance rendered as "6.66e-7%". Three significant figures either way, just
// never in a notation a player has to decode.
export const percentLabel = (value) => {
  if (value == null || !Number.isFinite(value)) return '';
  const text = (value * 100).toPrecision(3);
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
