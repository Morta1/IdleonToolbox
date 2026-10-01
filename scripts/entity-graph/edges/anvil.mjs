// What the anvil produces: the CraftMat items, made from nothing but hammer time, which is why no
// craftedFrom edge ever reached them. Each needs a Smithing level before the anvil offers it.
//
// The list ends in three unused slots the game names "Filler" and gates at Smithing LV 999, so
// they never unlock; they are skipped by that name rather than printed as products.
export const anvilProductEdges = (anvilProducts, items) => Object.values(anvilProducts || {})
  .filter((product) => product?.rawName && items?.[product.rawName]?.displayName !== 'Filler')
  .map((product) => ({
    from: 'station:anvil',
    to: `item:${product.rawName}`,
    rel: 'produces',
    meta: product.levelReq > 0 ? { levelReq: Number(product.levelReq) } : {},
    source: 'anvil'
  }));
