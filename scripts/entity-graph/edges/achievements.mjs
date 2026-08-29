// What an achievement actually hands over.
//
// Only two items exist on this side: gems and time candy. The reward strings in the data are
// display copy and mostly filler, so z-processing reads the grant out of the game's own drop event
// instead (see features/achievements.js), which leaves `gems` and `candy` as numbers rather than
// prose. Nothing else is granted, which is why there is no third case here.
//
// `rewards` rather than a new relation: it is the same shape as a quest reward, reads the same way
// on the item page, and an item that comes from both should list both under one heading.
export const achievementEdges = (achievements, items) => {
  const edges = [];
  for (const achievement of achievements || []) {
    // Filler rows carry no reward either, so nothing here needs the node builder's own guard.
    if (!achievement?.rawName) continue;
    const from = `achievement:${achievement.rawName}`;
    if (achievement.gems > 0 && items?.PremiumGem) {
      edges.push({
        from, to: 'item:PremiumGem', rel: 'rewards',
        meta: { amount: achievement.gems }, source: 'achievements'
      });
    }
    const candy = achievement.candy;
    if (candy?.rawName && candy.quantity > 0 && items?.[candy.rawName]) {
      edges.push({
        from, to: `item:${candy.rawName}`, rel: 'rewards',
        meta: { amount: candy.quantity }, source: 'achievements'
      });
    }
  }
  return edges;
};
