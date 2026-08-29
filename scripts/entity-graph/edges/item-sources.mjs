// The sources z-processing reads out of the game's code rather than its lists: bundles, dungeon
// drops and the Royal Guardian's own drops. See z-processing/features/itemSources.js for how they
// are found and why each anchor is a string the game's author wrote.
//
// What a bundle hands over. `yields` rather than `sells`: the reader's question on a cape page is
// "what else came with it", which is the same question a container answers, and the bundle carries
// no per-item price to sell it at - the dollar figure buys the whole thing.
export const itemSourceEdges = (itemSources, items) => {
  const edges = [];
  for (const [key, contents] of Object.entries(itemSources?.bundles || {})) {
    for (const [rawName, quantity] of Object.entries(contents || {})) {
      if (!items?.[rawName]) continue;
      edges.push({
        from: `bundle:${key}`,
        to: `item:${rawName}`,
        rel: 'yields',
        meta: quantity > 1 ? { quantity } : {},
        source: 'item-sources'
      });
    }
  }
  return edges;
};

// Dungeon and Royal Guardian drops have no seller and no container: they fall out of an activity,
// which is what the obtainedFrom label is for. They arrive here as a label rather than an edge for
// the same reason Sailing does, but now with a call site behind them rather than a guess from the
// item's type.
//
// Trash Island is the third: a shop on a World 2 island that takes trash rather than coins, which
// is what the four stamps and the nametag in it had no other source for.
export const codeGrantLabels = (itemSources) => {
  const labels = new Map();
  for (const rawName of Object.keys(itemSources?.dungeon || {})) labels.set(rawName, 'Dungeon');
  for (const rawName of Object.keys(itemSources?.royalGuardian || {})) labels.set(rawName, 'Royal Guardian');
  for (const rawName of Object.keys(itemSources?.trashIsland || {})) labels.set(rawName, 'Trash Island');
  return labels;
};
