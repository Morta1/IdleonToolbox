import { describe, it, expect } from 'vitest';
import * as data from '@website-data';

describe('website-data barrel', () => {
  // 148 keys are emitted as files; itemsArray is derived in the barrel. A missing name is a
  // build break for whichever of the 116 importing files needed it.
  it('exports 150 names', () => {
    expect(Object.keys(data)).toHaveLength(150);
  });

  it('has no empty export', () => {
    const empty = Object.entries(data).filter(([, v]) =>
      v === null || v === undefined
      || (Array.isArray(v) && v.length === 0)
      || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
    expect(empty.map(([k]) => k)).toEqual([]);
  });

  it('still exports the keys that live in shared-data', () => {
    expect(data.compass).toBeDefined();
    expect(data.sigils).toBeDefined();
    expect(data.ButtonBonusNames).toBeDefined();
  });

  it('still exports the heavy keys', () => {
    expect(Object.keys(data.items).length).toBeGreaterThan(2000);
    expect(Object.keys(data.monsterDrops).length).toBeGreaterThan(0);
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

  // Regression guard for the fix this change ships: commit 5921946 spread keychain stats
  // into the items literal only, leaving 25 of these at 0 for ~16 months. Asserted against
  // items rather than hardcoded, so it survives every regeneration.
  //
  // 30 keychains exist, and NOT all of them should be non-zero: EquipmentKeychain25-28 are
  // zeroed in `items` itself (genuinely no stat data) and must stay that way. The invariant
  // is that every keychain mirrors items - asserting "all non-zero" would fail on those 4.
  it('mirrors items for every keychain', () => {
    const keychains = data.itemsArray.filter((x) => /^EquipmentKeychain\d+$/.test(x.rawName));
    expect(keychains).toHaveLength(30);
    for (const kc of keychains) {
      expect(kc.UQ1txt).toBe(data.items[kc.rawName].UQ1txt);
      expect(kc.UQ1val).toBe(data.items[kc.rawName].UQ1val);
    }
  });

  // The 25 that actually carried the bug. Pinning the count stops a future regeneration
  // from silently re-zeroing them without the suite noticing.
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
