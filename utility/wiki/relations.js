// Collapsing a relation section's rows. Kept out of the panel so the probability can be tested
// without dragging MUI into the test environment, which vitest shares across files.

// A monster can reach one item through several drop tables: Efaunt carries Silver Pen in
// DropTable6, 7 and 8, all of which roll SuperDropTable2. The graph stores one edge per path,
// which is correct, and the panel used to print one ROW per path: "Efaunt 1 in 1,850" three times,
// with the number a player actually wants appearing nowhere.
//
// Independent rolls, so the chance of missing every path is the product of missing each, and the
// per-kill chance is one minus that. Three paths at 1 in 1,850 is 1 in 618, not 1 in 1,850.
// The single-path case returns the chance untouched rather than through the arithmetic: the round
// trip is lossy (1 - (1 - 0.152) is 0.15200000000000002), and most rows have exactly one path, so
// every one of them would otherwise carry drift the flat list never had.
export const combineChances = (chances) => {
  const real = chances.filter((chance) => chance > 0);
  if (real.length === 0) return 0;
  if (real.length === 1) return real[0];
  return 1 - real.reduce((miss, chance) => miss * (1 - chance), 1);
};

// What makes two rows the same row to a reader. Quantity and talent are part of it: one item
// rawName covers every talent book in the game, and Green Mushroom's three books are three
// different books, not one book listed three times.
const rowKey = (edge, otherId) => [
  otherId,
  edge.meta?.quantity ?? '',
  edge.meta?.talentName ?? '',
  edge.meta?.talentLevel ?? '',
  edge.meta?.recipe ? 'recipe' : ''
].join('|');

// One row per counterpart, carrying how many paths reached it and their combined odds. Order is
// preserved from the first appearance of each row, so a section that arrived sorted stays sorted.
export const collapseRows = (edges, dir) => {
  const rows = new Map();
  for (const edge of edges) {
    const otherId = dir === 'from' ? edge.to : edge.from;
    const key = rowKey(edge, otherId);
    if (!rows.has(key)) rows.set(key, { key, otherId, edges: [] });
    rows.get(key).edges.push(edge);
  }
  return [...rows.values()].map((row) => {
    const chances = row.edges.map((edge) => edge.meta?.effectiveChance ?? edge.meta?.chance ?? 0);
    const combined = combineChances(chances);
    return {
      ...row,
      edge: row.edges[0],
      paths: row.edges.length,
      // Only meaningful when several paths merged; a single-path row's combined chance is its own.
      combinedChance: combined > 0 ? combined : null
    };
  });
};

// idleon.wiki keeps flat lists short and tabulates the long ones, and so should we: the median
// entity has 3 relations and Silver Pen has 248. A table's header earns its height somewhere in
// between, and this is that line.
export const TABLE_THRESHOLD = 15;

// One threshold cannot serve both row shapes. A "Used in crafting" row is a name, and fifteen of
// them read fine as a list. A drop row is a name plus a quantity, a rate and a percentage, and in a
// half-width column the long names wrap while the numbers land wherever the wrap left them. Those
// rows want the table's fixed columns much sooner.
//
// It is not an edge case: the median monster drops 12 things, and 148 of the 325 that drop anything
// sit between six and fifteen, which is the whole band this moves.
export const DETAIL_TABLE_THRESHOLD = 6;

// A section carrying per-row numbers is the one that earns a table early. `Detail` is what renders
// them, so it is also what marks the section.
export const tableThreshold = (section) => (section?.Detail ? DETAIL_TABLE_THRESHOLD : TABLE_THRESHOLD);
