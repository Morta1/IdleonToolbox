import { cleanUnderscore } from '@utility/helpers';

// Every word must appear somewhere in name + description, so "wraith damage" matches across fields.
// Glyphs are stripped as the cards strip them on render, so a word glued to one still matches.
export const matchesUpgradeSearch = (upgrade, searchText) => {
  const terms = searchText?.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms?.length) return true;
  const haystack = cleanUnderscore(`${upgrade?.name ?? ''} ${upgrade?.description ?? ''}`)
    .replace(/[船般航舞製千膛]/g, '')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
};
