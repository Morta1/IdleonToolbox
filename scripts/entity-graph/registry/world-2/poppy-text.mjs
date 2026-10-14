// UPKEEP: kangaroo.ts formatDescription's token map; re-check it if Poppy gains a new placeholder.
const TOKENS = {
  '{': (x6) => ({ formula: 'linear', args: { perLevel: x6 } }),
  ']': (x6) => ({ formula: 'growth', args: { func: 'bigBase', x1: 1, x2: x6 / 100 } }),
  '~': (x6) => ({ formula: 'diminishingPercent', args: { perLevel: x6 } }),
  '?': (x6) => ({ formula: 'growth', args: { func: 'decay', x1: x6, x2: 40 } })
};

// A `?` is a placeholder only in the "+?%" and "_?%" shapes the game uses; a plain question mark
// ends a sentence.
// UPKEEP: every `?` in poppyBonuses and poppyTarBonuses descs sits between `+` or `_` and `%`.
const PLACEHOLDER = {
  '?': /[+_]\?%/
};

const isPlaceholder = (desc, token) => (PLACEHOLDER[token] ? PLACEHOLDER[token].test(desc) : desc.includes(token));

export const termsFor = (entry) => {
  const desc = String(entry.desc || '');
  return Object.entries(TOKENS)
    .filter(([token]) => isPlaceholder(desc, token))
    .map(([token, make]) => ({ token, ...make(entry.x6) }));
};
