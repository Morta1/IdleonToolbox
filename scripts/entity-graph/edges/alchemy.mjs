import { bubbleRawName, isRealMaterial } from '../nodes/alchemy.mjs';

// A separate relation from craftedFrom on purpose: an item's page reads "used in crafting" for an
// anvil recipe and "used in alchemy" for these, and the two are not the same answer to the same
// question. Nothing here is an ingredient either: a vial is DISCOVERED with its item and then
// upgraded with more of it, and a bubble is upgraded with its own, which is why the relation is
// upgradedWith rather than anything recipe-shaped.
//
// The liquids and the Blank padding slots are dropped: neither is an item, and the liquids ride on
// the node instead so the upgrade cost still reads in full.
export const alchemyEdges = (vials, cauldrons) => {
  const edges = [];

  for (const vial of Object.values(vials || {})) {
    if (!vial?.name) continue;
    for (const material of vial.itemReq || []) {
      if (!isRealMaterial(material?.rawName)) continue;
      edges.push({
        from: `vial:${vial.name}`,
        to: `item:${material.rawName}`,
        rel: 'upgradedWith',
        meta: {},
        source: 'vials'
      });
    }
  }

  Object.values(cauldrons || {}).forEach((bubbles, cauldronIndex) => {
    for (const bubble of bubbles || []) {
      const rawName = bubbleRawName(cauldronIndex, bubble?.bubbleIndex);
      if (!rawName) continue;
      for (const material of bubble.itemReq || []) {
        if (!isRealMaterial(material?.rawName)) continue;
        edges.push({
          from: `bubble:${rawName}`,
          to: `item:${material.rawName}`,
          rel: 'upgradedWith',
          // The cost the game quotes at level one. What it actually costs depends on the bubble's
          // level and on half a dozen account bonuses, none of which a save-less page has.
          meta: material.baseCost != null ? { baseCost: material.baseCost } : {},
          source: 'bubbles'
        });
      }
    }
  });

  return edges;
};
