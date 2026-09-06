import { describe, expect, it } from 'vitest';
import { DRAWN_SLOTS, EQUIPMENT_SLOTS, iconFor, itemsForSlot } from '@components/tools/wardrobe/slots';
import { SLOT_TYPES } from '@utility/wardrobeQuery';
import { monsterImage } from '@utility/spriteImages';
import { companions } from '@website-data';

describe('itemsForSlot', () => {
  for (const slot of Object.keys(SLOT_TYPES)) {
    it(`${slot} returns non-empty items whose Type is allowed for that slot`, () => {
      const options = itemsForSlot(slot);
      expect(options.length).toBeGreaterThan(0);
      for (const item of options) expect(SLOT_TYPES[slot].has(item.Type)).toBe(true);
    });
  }

  it('lists real trophies and replicas side by side, since they are different items', () => {
    const options = itemsForSlot('trophy');
    expect(options.some((item) => item.Type === 'TROPHY')).toBe(true);
    expect(options.some((item) => item.Type === 'REPLICA_TROPHY')).toBe(true);
    // A replica shares its original's ID and art, so the two only differ by rawName.
    expect(new Set(options.map((item) => item.rawName)).size).toBe(options.length);
  });
});

describe('DRAWN_SLOTS', () => {
  it('lists the seven drawn slots in spec order', () => {
    expect(DRAWN_SLOTS.map(({ slot }) => slot)).toEqual(['hat', 'weapon', 'cape', 'costume', 'trophy', 'nametag', 'companion']);
    expect(DRAWN_SLOTS.map(({ label }) => label)).toEqual(['Hat', 'Weapon', 'Cape', 'Costume', 'Trophy', 'Nametag', 'Companion']);
  });
  it('gives the companion no EquipOrder index: it lives on the account, not the character', () => {
    expect(DRAWN_SLOTS.at(-1).index).toBe(null);
  });
});

describe('the companion slot', () => {
  it('offers every companion, deduped by raw name and sorted by display name', () => {
    const options = itemsForSlot('companion');
    expect(options.length).toBeGreaterThan(150);
    expect(new Set(options.map(({ rawName }) => rawName)).size).toBe(options.length);
    expect(options.map(({ displayName }) => displayName))
      .toEqual([...options.map(({ displayName }) => displayName)].sort((a, b) => a.localeCompare(b)));
    expect(options.some(({ rawName }) => rawName === 'ram')).toBe(true);
  });
  it('leaves out the roster placeholders that carry no name', () => {
    const options = itemsForSlot('companion');
    for (const option of options) expect(option.displayName?.trim()).toBeTruthy();
    // The four unreleased entries have no name and no art, so the picker must not offer them.
    for (const rawName of ['shovel', 'slimmer', 'w7b8zzz', 'w7b9zzz']) {
      expect(options.some((option) => option.rawName === rawName), rawName).toBe(false);
    }
    expect(options.length).toBe(companions.filter(({ name }) => name?.trim()).length - 1);
  });
  it('draws its icon from the monster the companion is a pet of', () => {
    expect(iconFor('companion', { rawName: 'ram' })).toBe(monsterImage('ram'));
  });
  it('draws every other slot from the item art', () => {
    expect(iconFor('hat', { rawName: 'EquipmentHats1' })).toMatch(/data\/EquipmentHats1\.png$/);
  });
});

describe('itemsForSlot without a class', () => {
  it('lists weapons of every base class', () => {
    const types = new Set(itemsForSlot('weapon').map((item) => item.Type));
    expect(types.has('SPEAR')).toBe(true);
    expect(types.has('BOW')).toBe(true);
    expect(types.has('WAND')).toBe(true);
    expect(types.has('FISTICUFF')).toBe(true);
  });
  it('still rejects items without a sprite ID', () => {
    expect(itemsForSlot('hat').every((item) => Number.isFinite(item.ID))).toBe(true);
  });
});

describe('EQUIPMENT_SLOTS', () => {
  it('makes the trophy (10) and the nametag (14) pickable alongside the four body slots', () => {
    const bySlot = Object.fromEntries(EQUIPMENT_SLOTS.filter(({ slot }) => slot).map(({ slot, index }) => [slot, index]));
    expect(bySlot).toEqual({ hat: 0, weapon: 1, trophy: 10, cape: 12, nametag: 14, costume: 15 });
    expect(EQUIPMENT_SLOTS.find(({ index }) => index === 14).label).toBe('Replica Nametag');
  });
  it('only names slots the loadout query knows about', () => {
    for (const { slot } of EQUIPMENT_SLOTS.filter((entry) => entry.slot)) expect(SLOT_TYPES[slot]).toBeTruthy();
  });
});
