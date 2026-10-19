// Art for a cost's currency, from the page the cost is paid in. In order: the item (or meal) a node's `upgradedWith`
// edges say it spends; the page itself (a meal levels with copies of itself); else the one item or meal of that name.
// Exact name match only: "Moondust" matches "Moondust_(Dungeon)" (a qualifier the cost line drops) and "Orblets" matches
// "Orblet" (the plural the cost line prints), nothing looser. Two pages with the name and different art draw nothing.
// A row that sets its own `currencyIcon` keeps it.
const PAID_KINDS = new Set(['item', 'meal']);

const plain = (name) => String(name ?? '')
  .replace(/_/g, ' ')
  .replace(/\s*\([^)]*\)\s*$/, '')
  .trim()
  .toLowerCase();

const sameName = (currency, page) => {
  const a = plain(currency);
  const b = plain(page);
  return a !== '' && (a === b || a === `${b}s` || `${a}s` === b);
};

// Run after the icon pass, so every icon read here is one that exists on disk. Returns how many costs it drew.
export const currencyIcons = (nodes, edges) => {
  const paidWith = new Map();
  for (const edge of edges) {
    if (edge.rel !== 'upgradedWith') continue;
    if (!paidWith.has(edge.from)) paidWith.set(edge.from, []);
    paidWith.get(edge.from).push(edge.to);
  }
  // Every item and meal page's icons by plain name, so the last fallback is a lookup of the names sameName accepts
  // (the same, one "s" more, one "s" less) instead of a pass over every page per cost.
  const paidIcons = new Map();
  for (const page of Object.values(nodes)) {
    if (!PAID_KINDS.has(page.kind) || !page.icon) continue;
    const key = plain(page.name);
    if (!paidIcons.has(key)) paidIcons.set(key, new Set());
    paidIcons.get(key).add(page.icon);
  }
  const paidIconsOf = (currency) => {
    const a = plain(currency);
    if (a === '') return [];
    const names = [a, `${a}s`, ...(a.endsWith('s') ? [a.slice(0, -1)] : [])];
    return [...new Set(names.flatMap((name) => [...(paidIcons.get(name) || [])]))];
  };
  const iconsOf = (currency, ids) => [...new Set(ids
    .map((id) => nodes[id])
    .filter((page) => page?.icon && sameName(currency, page.name))
    .map((page) => page.icon))];
  let drawn = 0;
  const draw = (cost, id) => {
    if (!cost?.currency || cost.currencyIcon) return;
    const icons = [iconsOf(cost.currency, paidWith.get(id) || []), iconsOf(cost.currency, [id]), paidIconsOf(cost.currency)]
      .find((found) => found.length > 0) ?? [];
    if (icons.length !== 1) return;
    cost.currencyIcon = icons[0];
    drawn += 1;
  };
  for (const [id, node] of Object.entries(nodes)) {
    [].concat(node.cost || []).forEach((cost) => draw(cost, id));
    (node.entries || []).forEach((entry) => [].concat(entry.cost || []).forEach((cost) => draw(cost, id)));
  }
  return drawn;
};
