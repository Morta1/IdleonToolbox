// Data-free, so the registry, the build scripts and the wiki components can all import it.

// Acronyms the game writes in capitals that title case would turn into a word (VIP_PARCHMENT,
// EVOLUTION_GMO, OG_FERTILIZER, DNA_SPLICER, EXP_BALLOON), and the roman numerals that end tiered
// names (SPROUTLUCK_II).
// UPKEEP: one-letter numerals (I, V) already survive; add any new acronym a patch's names use.
export const KEEP_UPPER = new Set(['VIP', 'GMO', 'OG', 'DNA', 'EXP', 'II', 'III', 'IV']);

// The game writes most names in capitals with underscores. Underscores stay so cleanUnderscore
// still turns them into spaces at render time.
export const titleCase = (text) => String(text || '')
  .split('_')
  .map((word) => (KEEP_UPPER.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
  .join('_');

// The game never draws an item type as text, so the page title-cases it. The node keeps the raw
// value because the tooltip and getPowerType read it. A trailing underscore is padding (STORAGE_),
// and a value that already carries lower case (`Bits`, `bCraft`) is written as the game wrote it.
export const categoryLabel = (category) => {
  const text = String(category ?? '').replace(/_+$/, '');
  return (/[a-z]/.test(text) ? text : titleCase(text)).replace(/_/g, ' ').trim();
};
