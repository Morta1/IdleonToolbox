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
  const paidKinds = Object.keys(nodes).filter((id) => PAID_KINDS.has(nodes[id].kind));
  const iconsOf = (currency, ids) => [...new Set(ids
    .map((id) => nodes[id])
    .filter((page) => page?.icon && sameName(currency, page.name))
    .map((page) => page.icon))];
  let drawn = 0;
  const draw = (cost, id) => {
    if (!cost?.currency || cost.currencyIcon) return;
    const icons = [paidWith.get(id) || [], [id], paidKinds]
      .map((ids) => iconsOf(cost.currency, ids))
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
