// Vials and bubbles: the two alchemy things a player looks up by their ingredients.
//
// They earn a place in the graph because of what they link to, not because they are new pages. 171
// distinct items feed a vial or a bubble, and 55 of those had no outgoing use at all: dropped by
// something, crafted into nothing, and the page ended there. This is what a Bean Slice is for.
import { gameTable } from '../registry/data.mjs';
import { titleCase } from '../registry/text.mjs';
import { itemPageName } from './items.mjs';

// The order of cauldrons.json, which is the game's own. The letter is the one the art is named
// after: the Power cauldron's first bubble is aUpgradesO0.
const CAULDRON_LETTERS = ['O', 'G', 'P', 'Y'];

// A cauldron's name is its panel title in cauldronTitles (POWER_CAULDRON, HIGH-IQ_CAULDRON), title-cased
// on each side of the hyphen.
const cauldronLabel = (title) => String(title || '').replace(/_CAULDRON$/, '').split('-').map(titleCase).join('-');

// The four alchemy liquids are not items: nothing in items.json answers to Liquid1, and they have
// no page to link to. They ride along on the node so a recipe still reads in full.
// UPKEEP: the liquid names are the wiki's. Not extracted: N.js keeps no list of them, only prose that words them differently ("Trench_Seawater").
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

// The game prices a slot holding Bits on its own doubling arm (CauldronCosts tests the slot's item name for "Bits"; the
// z-processing table's shape pin goes missing if that test changes).
const BITS = 'Bits';
const BASE_COST_NOTE = 'Base cost, before discounts.';
const LIQUID_NOTE = 'No discounts apply.';

// One cost line per paid slot, in the game's slot order, each priced at the reader's level by GAME.bubbleCost. The
// material is named after its item page, whose art currency-icons.mjs then draws (cauldrons.json's own name is the raw
// display name, "Strung_Jewels" on every sailing treasure); a liquid has no page, so it carries its own art. Without the
// table every line is left out (the caller drops the cost).
const bubbleCosts = (bubble, table, items) => {
  if (!table) return null;
  const bubbleIndex = Number(String(bubble.bubbleIndex).slice(1));
  const slots = (bubble.itemReq || []).filter((slot) => isLiquid(slot?.rawName) || isRealMaterial(slot?.rawName));
  const liquidCount = slots.filter((slot) => isLiquid(slot.rawName)).length;
  // The cap only clamps the material arm, and only after the discounts: the page prints the curve and says so.
  const capped = slots.some((slot) => !isLiquid(slot.rawName) && slot.rawName !== BITS);
  const note = capped ? { note: `${BASE_COST_NOTE} The game caps the material price at ${table.max.toLocaleString('en-US')} after discounts.` } : {};
  return slots.map((slot) => {
    const base = slot.baseCost ?? 0;
    if (isLiquid(slot.rawName)) {
      const name = liquidName(slot.rawName);
      return {
        formula: 'bubbleLiquidCost',
        args: { base },
        currency: name,
        currencyIcon: `/data/Liquid${liquidIndex(slot.rawName)}_x1.png`,
        // GRIND_TIME pays in two liquids: each line names its own.
        label: liquidCount > 1 ? `${name} for this level` : 'Liquid for this level',
        // CauldronCosts adds no discount to the liquid arm, and the cap is the material's alone.
        note: LIQUID_NOTE
      };
    }
    if (slot.rawName === BITS) return { formula: 'bubbleBitsCost', args: { base }, currency: BITS, label: 'Bits for this level', ...note };
    const currency = itemPageName(slot.rawName, items?.[slot.rawName]) || slot.name || slot.rawName;
    return { formula: 'bubbleMaterialCost', args: { base, bubbleIndex }, currency, label: 'Material for this level', ...note };
  });
};

// The description carries a `{` (a few use `$`) where the bonus goes. Both tokens read the same
// growth, at whatever level the reader types.
const alchemyTerms = (entry, levelLabel, cap) => (entry?.func ? {
  levelLabel,
  cap,
  terms: ['{', '$'].map((token) => ({
    token,
    formula: 'growth',
    args: { func: entry.func, x1: entry.x1 ?? null, x2: entry.x2 ?? null }
  }))
} : null);

export const vialNodes = (vials, vialCosts = []) => {
  const nodes = {};
  // The ladder's last rung is the highest level a vial reaches.
  const vialCap = (vialCosts || []).reduce((top, rung) => Math.max(top, rung?.level ?? 0), 0) || null;
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
      ...(alchemyTerms(vial, 'Vial level', vialCap) ? { effect: alchemyTerms(vial, 'Vial level', vialCap) } : {}),
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
  const letter = CAULDRON_LETTERS[cauldronIndex];
  // bubbleIndex is the cauldron's own prefix plus a number: "_0" in Power, "a0" in Quicc.
  return letter ? `aUpgrades${letter}${String(bubbleIndex).slice(1)}` : null;
};

// A bubble that costs FillerMaterial ("this material isn't in the game yet") is one of the slots the
// game names BUBBLE: "It doesn't have a bonus yet". No page, no cost row.
// UPKEEP: game placeholder, re-check on a game update: FillerMaterial is the cost the game puts on its seven unreleased BUBBLE slots.
const UNRELEASED_MATERIAL = 'FillerMaterial';
export const isPlaceholderBubble = (bubble) => (bubble?.itemReq || []).some((material) => material?.rawName === UNRELEASED_MATERIAL);

export const bubbleNodes = (cauldrons, data) => {
  const nodes = {};
  const titles = gameTable(data, 'cauldronTitles');
  const costTable = gameTable(data, 'bubbleCost');
  Object.values(cauldrons || {}).forEach((bubbles, cauldronIndex) => {
    const label = titles?.[cauldronIndex] ? cauldronLabel(titles[cauldronIndex]) : '';
    for (const bubble of bubbles || []) {
      const rawName = bubbleRawName(cauldronIndex, bubble?.bubbleIndex);
      if (!rawName || !bubble?.bubbleName || isPlaceholderBubble(bubble)) continue;
      const cost = bubbleCosts(bubble, costTable, data?.items);
      nodes[`bubble:${rawName}`] = {
        kind: 'bubble',
        rawName,
        name: bubble.bubbleName,
        // Same for bubbles: the cauldron's own order, which is how the game lays them out and the
        // only sequence in which their costs and effects make sense read together.
        order: cauldronIndex * 100 + Number(String(bubble.bubbleIndex).slice(1)),
        icon: `/data/${rawName}.png`,
        // Without the titles the cauldron is left out of the category rather than four cauldrons sharing one band.
        category: label ? `${label} Cauldron` : null,
        description: bubble.desc || null,
        ...(alchemyTerms(bubble, 'Bubble level', null) ? { effect: alchemyTerms(bubble, 'Bubble level', null) } : {}),
        // The game's COSTS box: the material and the liquid together, both at the level the reader types.
        ...(cost?.length ? { cost } : {})
      };
    }
  });
  return nodes;
};
