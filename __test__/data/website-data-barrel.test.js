import { describe, it, expect } from 'vitest';
import * as data from '@website-data';

describe('website-data barrel', () => {
  // 158 keys come from z-processing (26 in their own file, 132 inside shared-data.json);
  // itemsArray is derived in the barrel. A missing name is a build break for whichever
  // importing file needed it.
  it('exports 163 names', () => {
    // 2.3.531 added jellyUpgrades; spiceNames moved here from a hand-kept frontend copy;
    // gameTables holds the lists parsers used to copy from the game code by hand;
    // upgradeHelp / upgradeHelpPlaceholders hold the (?) help text of upgrade panels;
    // mapMulticharReq holds the characters each multi-character door needs.
    expect(Object.keys(data)).toHaveLength(163);
  });

  it('has no empty export', () => {
    const empty = Object.entries(data).filter(([, v]) =>
      v === null || v === undefined
      || (Array.isArray(v) && v.length === 0)
      || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
    expect(empty.map(([k]) => k)).toEqual([]);
  });

  // Exists so four parsers can read one number per monster without importing the 2.08MB
  // monsterDrops table, which parsers/character.ts otherwise dragged onto 210 of 252 pages.
  // Asserted against monsterDrops rather than hardcoded, so it survives every regeneration.
  it('derives monsterCoinQuantity consistently with monsterDrops', () => {
    const names = Object.keys(data.monsterCoinQuantity);
    expect(names.length).toBe(Object.keys(data.monsterDrops).length);
    for (const name of names) {
      const coin = data.monsterDrops[name].find((drop) => drop.rawName === 'COIN');
      expect(data.monsterCoinQuantity[name]).toBe(coin.quantity);
    }
  });

  it('derives itemsArray from items', () => {
    expect(data.itemsArray).toEqual(Object.values(data.items));
  });

  // A bare Object.values would alias the two; today they come from separate parses, and
  // hatRack.ts-style code that mutates a copy would start corrupting items.
  it('gives itemsArray its own objects rather than aliasing items', () => {
    const first = Object.keys(data.items)[0];
    expect(data.itemsArray[0]).not.toBe(data.items[first]);
    expect(data.itemsArray[0]).toEqual(data.items[first]);
  });

  // Regression guard: commit 5921946 spread keychain stats into the items literal only, leaving
  // 25 keychains at 0 in itemsArray for ~16 months. The itemsArray toEqual above catches any
  // drift from items; this pins that items itself zeroes only EquipmentKeychain25-28 (genuinely
  // no stat data), so a regeneration cannot silently re-zero the rest.
  it('leaves exactly four keychains legitimately zeroed', () => {
    const zeroed = data.itemsArray
      .filter((x) => /^EquipmentKeychain\d+$/.test(x.rawName))
      .filter((x) => x.UQ1txt === 0 && x.UQ1val === 0)
      .map((x) => x.rawName);
    expect(zeroed).toEqual([
      'EquipmentKeychain25', 'EquipmentKeychain26', 'EquipmentKeychain27', 'EquipmentKeychain28'
    ]);
  });
});
