// Banding a category listing by the entity's own facet: the bestiary sections for monsters, the
// world for NPCs, the cauldron for bubbles.
//
// There is no letter banding. A to Z was the fallback for kinds with no usable facet, and it earned
// nothing: the reader already has a filter box and a name they are looking for, and cutting the
// list into 27 headers told them only what the first letter of each name was, which they could see.
// A kind with no facet reads as one list.

// A facet earns the job only if it actually divides the set. Twelve bands is about as many as a
// page can carry before the bands are the noise; past that the facet is a filter, not a grouping.
export const FACET_MAX = 12;

// And it has to divide it evenly enough to mean something. Every monster has a category, but 324
// of 398 are the category "Monster", so banding by it produces one band and four slivers: that is
// a worse read than A to Z, which at least tells you where you are.
export const FACET_DOMINANCE = 0.6;

// Some entities genuinely have no facet: 23 of the 118 NPCs (the event ones, the souls, Bort) are
// placed on no map, so no world can be read for them. A handful like that belongs in its own band
// rather than forcing the whole listing back to A-Z, but past this share the facet is not really
// describing the set any more.
export const FACET_MISSING_MAX = 0.25;

// Sorted last, after every real facet, because it is the absence of one.
export const OTHER_BAND = 'Other';

// The bands that are not worlds, in idleon.wiki's own Bestiary order: the worlds, then Boss,
// Events, Dungeon and The Rift. An alphabet would open the page on Bosses and bury World 1.
export const SECTION_ORDER = ['Bosses', 'Events', 'Dungeon', 'The Rift'];

export const chooseGrouping = (categories, { missingMax = FACET_MISSING_MAX } = {}) => {
  const values = categories.filter(Boolean);
  if (values.length === 0) return 'none';

  const counts = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  const distinct = Object.keys(counts).length;
  if (distinct < 2 || distinct > FACET_MAX) return 'none';

  const biggest = Math.max(...Object.values(counts));
  if (biggest / categories.length > FACET_DOMINANCE) return 'none';
  // A few entities with no category go to their own band; a lot of them mean the facet is not
  // describing the set. 23 NPCs with no world is a band, 282 monsters with no world is not.
  const missing = (categories.length - values.length) / categories.length;
  if (missing > missingMax) return 'none';

  return 'facet';
};

// Bands in the order they should read.
export const groupEntries = (entries, mode, categoryOf) => {
  if (mode !== 'facet') return entries.length ? [{ key: 'all', label: '', entries }] : [];

  const bands = new Map();
  for (const entry of entries) {
    const key = categoryOf(entry) || OTHER_BAND;
    if (!bands.has(key)) bands.set(key, { key, label: key, entries: [] });
    bands.get(key).entries.push(entry);
  }
  // Where the entries carry the game's own order, the bands take it as well: the Power cauldron
  // comes before Quicc in game and would come after High-IQ in an alphabet.
  const list = [...bands.values()];
  if (mode === 'facet' && entries.every((entry) => entry.order != null)) {
    return list.sort((a, b) => Math.min(...a.entries.map((e) => e.order)) - Math.min(...b.entries.map((e) => e.order)));
  }
  // Worlds in order, then the bands that are not worlds, then the absence of one.
  const rank = (key) => {
    if (key === OTHER_BAND) return 2 + SECTION_ORDER.length;
    if (/^World \d+$/.test(key)) return 0;
    const named = SECTION_ORDER.indexOf(key);
    return named >= 0 ? 1 + named : 1 + SECTION_ORDER.length;
  };
  return list.sort((a, b) => {
    if (rank(a.key) !== rank(b.key)) return rank(a.key) - rank(b.key);
    return a.key.localeCompare(b.key, 'en', { numeric: true });
  });
};
