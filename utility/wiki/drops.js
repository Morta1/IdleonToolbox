// Drop-odds formatting and drop-table tiering. Kept out of the panel component so the maths can be
// tested without dragging MUI into the test environment, which vitest shares across files.

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

export const dropQuantityLabel = (meta) => (
  meta?.quantity > 1 ? `x${meta.quantity.toLocaleString('en-US')}` : ''
);

// One item rawName, "Special Talent Book", covers every book in the game; which talent it teaches
// lives on the drop. Without this a monster's two or three books are indistinguishable rows.
// idleon.wiki title-cases the talent the same way, so "Bored To Death" reads identically on both.
export const dropTalentLabel = (meta) => {
  if (!meta?.talentName) return '';
  const talent = meta.talentName
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
  return meta.talentLevel ? `${talent} Lv ${meta.talentLevel}` : talent;
};

// The game gates rare loot behind nested tables: a monster rolls Rare Drop, and Rare Drop rolls
// Mega-Rare. `chance` is the odds inside whichever table the item sits in, so it is only the
// per-kill number for base drops. `effectiveChance` folds in every table roll above it.
export const dropOdds = (meta) => oneIn(meta?.effectiveChance ?? meta?.chance);

// Depth is the game's own tiering, and it never exceeds 2. The table's raw name is the fallback
// so a future third tier degrades to something truthful rather than mislabelled.
const DROP_TIER_LABELS = ['Base drops', 'Rare Drop', 'Mega-Rare'];

export const dropTierLabel = (path) => DROP_TIER_LABELS[path.length]
  ?? (path[path.length - 1] || '').replace(/_/g, ' ');

// Splits a monster's drops into the tiers the game shows, each headed by the odds of reaching that
// table from a single kill. Cumulative, not relative to the tier above: Mega-Rare is 1 in 40,000
// per kill even though the game labels it 1 in 200 of the Rare Drop roll it hangs off.
export const dropTierGroups = (edges) => {
  const groups = new Map();
  for (const edge of edges) {
    const path = edge.meta?.dropTablePath || [];
    const key = path.join('>');
    if (!groups.has(key)) {
      groups.set(key, { key, path, tableChance: edge.meta?.tableChance ?? 1, edges: [] });
    }
    groups.get(key).edges.push(edge);
  }
  return [...groups.values()]
    .sort((a, b) => a.path.length - b.path.length)
    .map((group) => ({
      ...group,
      label: dropTierLabel(group.path),
      odds: group.path.length > 0 ? oneIn(group.tableChance) : '',
      table: group.path[group.path.length - 1] || ''
    }));
};
