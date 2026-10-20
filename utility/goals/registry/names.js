import { cleanUnderscore } from '@utility/helpers';

export const cleanUpgradeName = (name) => cleanUnderscore(name
  .replace(/[船般航舞製]/, '')
  .replace('(Tap_for_more_info)', '')
  .replace('(#)', ''));

// Masterclass glyphs plus 千膛, which only show up in the Royal Guardian catalogs (statues, orblet market, armory).
export const cleanText = (str) => cleanUnderscore((str ?? '').replace(/[船般航舞製千膛]/g, ''));

// Catalogs repeat names (placeholder bonuses, twin entries): the 2nd and later get "(n)" so searches stay unambiguous.
export const withUniqueNames = (rows, nameOf) => {
  const seen = new Map();
  return rows.map((row) => {
    const base = nameOf(row);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { ...row, goalName: count > 1 ? `${base} (${count})` : base };
  });
};

export const capitalizeFirst = (str) => str.replace(/^./, (c) => c.toUpperCase());

// "SPROUTLUCK_II" -> "Sproutluck II": title case that keeps roman-numeral tiers upper case
export const titleCaseTiers = (str) => cleanUnderscore(str ?? '').toLowerCase()
  .replace(/(^|\s)(\S+)/g, (_, space, word) => space + (/^[ivx]+$/.test(word) ? word.toUpperCase() : word.replace(/^./, (c) => c.toUpperCase())));
