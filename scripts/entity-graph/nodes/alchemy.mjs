// Vials and bubbles: the two alchemy things a player looks up by their ingredients.
//
// They earn a place in the graph because of what they link to, not because they are new pages. 171
// distinct items feed a vial or a bubble, and 55 of those had no outgoing use at all: dropped by
// something, crafted into nothing, and the page ended there. This is what a Bean Slice is for.

// The order of cauldrons.json, which is the game's own. The letter is the one the art is named
// after: the Power cauldron's first bubble is aUpgradesO0.
const CAULDRONS = [
  { name: 'power', label: 'Power', letter: 'O' },
  { name: 'quicc', label: 'Quicc', letter: 'G' },
  { name: 'high-iq', label: 'High-IQ', letter: 'P' },
  { name: 'kazam', label: 'Kazam', letter: 'Y' }
];

// The four alchemy liquids are not items: nothing in items.json answers to Liquid1, and they have
// no page to link to. They ride along on the node so a recipe still reads in full.
const LIQUIDS = ['Water Drops', 'Liquid N2', 'Trench H2O', 'Toxic Hg'];

const liquidIndex = (rawName) => {
  const match = /^Liquid(\d)$/.exec(rawName || '');
  return match ? Number(match[1]) : null;
};

const liquidName = (rawName) => {
  const index = liquidIndex(rawName);
  return index ? LIQUIDS[index - 1] || null : null;
};

export const isLiquid = (rawName) => Boolean(liquidName(rawName));
export const isRealMaterial = (rawName) => Boolean(rawName) && rawName !== 'Blank' && !isLiquid(rawName);

// `Liquid1_x1` is the art the rest of the site already uses for a liquid, so the wiki draws the
// same thing rather than inventing a second convention for it.
const liquidsOf = (itemReq) => (itemReq || [])
  .filter((material) => isLiquid(material?.rawName))
  .map((material) => ({
    name: liquidName(material.rawName),
    icon: `/data/Liquid${liquidIndex(material.rawName)}_x1.png`,
    cost: material.baseCost ?? null
  }));

export const vialNodes = (vials, vialCosts = []) => {
  const nodes = {};
  Object.values(vials || {}).forEach((vial, index) => {
    if (!vial?.name) return;
    nodes[`vial:${vial.name}`] = {
      kind: 'vial',
      rawName: vial.name,
      // The history is keyed by vials.json's own position (an object keyed '0'..'85') rather
      // than by name, so the node has to carry the index it was built from, the same join
      // companionIndex gives a pet.
      vialIndex: index,
      name: vial.name,
      // The order of the game's Vials tab. Not an unlock sequence, since a vial can be discovered
      // whenever its item is found, but it is the order players read and refer to them in, and
      // alphabetical is no order at all for a progression.
      order: index,
      // A vial has no art of its own: the game draws the same flask at every level and identifies
      // it by the item it is brewed from, which is what the account page shows beside it too.
      icon: vial.mainItem ? `/data/${vial.mainItem}.png` : null,
      category: 'Vial',
      description: vial.desc || null,
      // The description carries a `{` where the bonus goes, and what fills it depends on the
      // level. The growth function and its two constants travel with the node so the page can
      // fill it in at level one, which is a real number rather than a player's number.
      effect: { func: vial.func || null, x1: vial.x1 ?? null, x2: vial.x2 ?? null },
      // The vial RNG score the item has to reach before it discovers the vial. Higher is rarer:
      // Copper Corona is 1 and the late-game vials are 99.
      discoveryScore: vial.discoveryScore ?? null,
      // The same ladder for all 86 vials, carried on the node rather than threaded through the
      // page as a separate prop: it is thirteen small rows, and this way every route that renders
      // a vial has it, including the client-side /wiki?e= path that ships no build-time slice.
      upgradeCosts: vialCosts,
      liquids: liquidsOf(vial.itemReq)
    };
  });
  return nodes;
};

export const bubbleRawName = (cauldronIndex, bubbleIndex) => {
  const letter = CAULDRONS[cauldronIndex]?.letter;
  // bubbleIndex is the cauldron's own prefix plus a number: "_0" in Power, "a0" in Quicc.
  return letter ? `aUpgrades${letter}${String(bubbleIndex).slice(1)}` : null;
};

export const bubbleNodes = (cauldrons) => {
  const nodes = {};
  Object.values(cauldrons || {}).forEach((bubbles, cauldronIndex) => {
    const cauldron = CAULDRONS[cauldronIndex];
    for (const bubble of bubbles || []) {
      const rawName = bubbleRawName(cauldronIndex, bubble?.bubbleIndex);
      if (!rawName || !bubble?.bubbleName) continue;
      nodes[`bubble:${rawName}`] = {
        kind: 'bubble',
        rawName,
        name: bubble.bubbleName,
        // Same for bubbles: the cauldron's own order, which is how the game lays them out and the
        // only sequence in which their costs and effects make sense read together.
        order: cauldronIndex * 100 + Number(String(bubble.bubbleIndex).slice(1)),
        icon: `/data/${rawName}.png`,
        category: `${cauldron?.label || ''} Cauldron`.trim(),
        description: bubble.desc || null,
        effect: { func: bubble.func || null, x1: bubble.x1 ?? null, x2: bubble.x2 ?? null },
        liquids: liquidsOf(bubble.itemReq)
      };
    }
  });
  return nodes;
};
