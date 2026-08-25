import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { craftSellPrices } from '../../scripts/entity-graph/craft-prices.mjs';

const items = {
  Grasslands1: { sellPrice: 3 },      // Spore Cap
  Copper: { sellPrice: 3 },           // Copper Ore
  Grasslands3: { sellPrice: 7 },      // Bean Slices
  IronBar: { sellPrice: 32 },
  CraftMat1: { sellPrice: 3 },        // Thread
  EquipmentHats1: { sellPrice: 175 }, // Farmer Brim, the field the game ignores
  EquipmentHats17: { sellPrice: 1000 },
  EquipmentHats3: { sellPrice: 8500 },
  DungCredits2: { sellPrice: 0 }
};

// In anvil order, which is the order crafts.json is emitted in.
const crafts = {
  Farmer_Brim: { rawName: 'EquipmentHats1', materials: [{ rawName: 'Grasslands1', itemQuantity: 4 }] },
  Copper_Helmet: {
    rawName: 'EquipmentHats17',
    materials: [{ rawName: 'Copper', itemQuantity: 20 }, { rawName: 'Grasslands3', itemQuantity: 40 }]
  },
  Thief_Hood: {
    rawName: 'EquipmentHats3',
    materials: [
      { rawName: 'EquipmentHats17', itemQuantity: 1 },
      { rawName: 'IronBar', itemQuantity: 15 },
      { rawName: 'CraftMat1', itemQuantity: 40 }
    ]
  },
  Cedar_Pendant: {
    rawName: 'EquipmentPendant19',
    materials: [{ rawName: 'DungCredits2', subType: 'CURRENCY', itemQuantity: 30 }]
  }
};

describe('craftSellPrices', () => {
  // Every one of these was read off idleon.wiki, which prints the same base the game computes
  // before a save's bribe and alchemy bonus scales it.
  it('prices a craft from its materials, not from its own field', () => {
    const prices = craftSellPrices(crafts, items);
    expect(prices.get('EquipmentHats1')).toBe(12);   // 4 Spore Caps at 3
  });

  it('feeds a craft its ingredients own recipe price', () => {
    const prices = craftSellPrices(crafts, items);
    expect(prices.get('EquipmentHats17')).toBe(340); // 20 ore at 3 + 40 bean slices at 7
    // 340 for the helmet, not its 1000 field, plus 15 iron bars and 40 thread.
    expect(prices.get('EquipmentHats3')).toBe(940);
  });

  // Dungeon-shop crafts are not on an anvil tab, so the game keeps their own field for them.
  it('leaves a craft bought with a currency alone', () => {
    const prices = craftSellPrices(crafts, items);
    expect(prices.has('EquipmentPendant19')).toBe(false);
  });

  it('gives no price to a recipe whose materials are all worthless', () => {
    const prices = craftSellPrices(
      { Thing: { rawName: 'Thing', materials: [{ rawName: 'Unknown', itemQuantity: 5 }] } },
      {}
    );
    expect(prices.has('Thing')).toBe(false);
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const price = (rawName) => graph.nodes[`item:${rawName}`]?.sellPrice;

  it('carries the recipe price, matching what idleon.wiki prints', () => {
    expect(price('EquipmentHats1')).toBe(12);
    expect(price('EquipmentHats17')).toBe(340);
    expect(price('EquipmentHats3')).toBe(940);
  });

  it('leaves an uncraftable item on its own field', () => {
    expect(price('Copper')).toBe(3);
  });
});
