// A stamp is upgraded with one material, the same way a vial and a bubble are, so it takes the same
// relation rather than a near-duplicate of it.
//
// The material was already on the stamp node as a bare rawName and nothing linked it: Sword Stamp
// knew it wanted Spore Cap, and Spore Cap's own page had no idea. All 128 stamps name a material,
// all 128 resolve to an item, and 15 of those items had no outgoing use at all before this.
export const stampEdges = (stamps) => {
  const edges = [];
  for (const group of Object.values(stamps || {})) {
    for (const stamp of Object.values(group || {})) {
      const material = (stamp?.itemReq || []).find((item) => item?.rawName && item.rawName !== 'Blank');
      if (!stamp?.rawName || !material) continue;
      edges.push({
        from: `item:${stamp.rawName}`,
        to: `item:${material.rawName}`,
        rel: 'upgradedWith',
        // No quantity: what a level costs is a curve off the stamp's own baseMatCost and powMatBase,
        // not a fixed number, and nothing here has the level to evaluate it at.
        meta: {},
        source: 'stamps'
      });
    }
  }
  return edges;
};
