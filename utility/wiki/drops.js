// Drop-odds formatting and drop-table tiering. Kept out of the panel component so the maths can be
// tested without dragging MUI into the test environment, which vitest shares across files.
import { oneIn } from './odds.mjs';

export { oneIn, percentLabel } from './odds.mjs';

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

// A label two bands share is the only thing that told them apart once the raw table name went, so
// they are numbered in list order. A Mega-Rare band under a numbered Rare band names its parent
// instead, and a lone Rare band keeps the plain label.
const numberRepeatedBands = (groups) => {
  const totals = {};
  for (const group of groups) totals[group.label] = (totals[group.label] || 0) + 1;

  const seen = {};
  const labels = new Map();
  for (const group of groups) {
    seen[group.label] = (seen[group.label] || 0) + 1;
    const parent = group.path.length === 2 ? labels.get(group.path[0]) : null;
    const numbered = `${group.label} ${seen[group.label]}`;
    labels.set(group.key, parent && parent !== DROP_TIER_LABELS[1]
      ? `${group.label} (from ${parent})`
      : totals[group.label] > 1 ? numbered : group.label);
  }
  return groups.map((group) => ({ ...group, label: labels.get(group.key) }));
};

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
  return numberRepeatedBands([...groups.values()]
    .sort((a, b) => a.path.length - b.path.length)
    .map((group) => ({
      ...group,
      label: dropTierLabel(group.path),
      odds: group.path.length > 0 ? oneIn(group.tableChance) : ''
    })));
};
