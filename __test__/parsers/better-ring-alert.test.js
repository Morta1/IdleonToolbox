import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { classSpecificAlerts, getInventoryLocation } from '@utility/dashboard/characters';
import { CLASSES } from '@parsers/talents';
import { parseData } from '@parsers/index';
import raw from '../../data/raw.json';

// The Arcane Cultist ring rolls both an accuracy and a tachyon stat, and a drop can be positive on
// one and negative on the other, so which stats count decides which ring wins.
const ring = (UQ1val, UQ2val, extra = {}) => ({
  rawName: 'EquipmentRingsArc0',
  UQ1txt: '%_ARCANIST_ACC',
  UQ1val,
  UQ2txt: '%_EXTRA_TACHYONS',
  UQ2val,
  ...extra
});

const buildOptions = (value) => ({ classSpecific: { betterRing: { checked: true, props: { value } } } });

const buildCharacter = (equipped, inventory) => ({
  class: CLASSES.Arcane_Cultist,
  activeBuffs: [{ name: 'ARCANIST_FORM', level: 1, funcX: 'add', x1: 1, x2: 0 }],
  equipment: [null, null, null, null, null, equipped, null, null],
  inventory
});

describe('better class-specific ring alert', () => {
  const equipped = ring(8, -5);
  const tachyonRing = ring(-17, 7);

  it('ignores a stat the user turned off', () => {
    const alerts = classSpecificAlerts(null, null, buildCharacter(equipped, [tachyonRing]), 0,
      buildOptions({ arcanistAccuracy: false, extraTachyons: true }));
    expect(alerts?.betterRing).toBe(tachyonRing);
  });

  it('scores both stats together when both are on', () => {
    const alerts = classSpecificAlerts(null, null, buildCharacter(equipped, [tachyonRing]), 0,
      buildOptions({ arcanistAccuracy: true, extraTachyons: true }));
    expect(alerts?.betterRing).toBeUndefined();
  });

  it('always counts a stat with no option of its own', () => {
    const elementRing = { rawName: 'EquipmentRingsTempest0', UQ1txt: '%_GRASS_ELEMENT_DMG', UQ1val: 25, UQ2txt: 0, UQ2val: 0 };
    const equippedElement = { ...elementRing, UQ1val: 20 };
    const character = {
      class: CLASSES.Wind_Walker,
      activeBuffs: [{ name: 'TEMPEST_FORM', level: 1, funcX: 'add', x1: 1, x2: 0 }],
      equipment: [null, null, null, null, null, equippedElement, null, null],
      inventory: [elementRing]
    };
    const alerts = classSpecificAlerts(null, null, character, 0,
      buildOptions({ arcanistAccuracy: false, extraTachyons: false }));
    expect(alerts?.betterRing).toBe(elementRing);
  });
});

describe('inventory location', () => {
  it('maps a raw slot onto the game\'s 4x4 bag pages', () => {
    expect(getInventoryLocation(0)).toBe('bag 1, row 1, col 1');
    expect(getInventoryLocation(15)).toBe('bag 1, row 4, col 4');
    expect(getInventoryLocation(16)).toBe('bag 2, row 1, col 1');
    expect(getInventoryLocation(38)).toBe('bag 3, row 2, col 3');
  });

  it('says nothing when the slot is missing', () => {
    expect(getInventoryLocation(undefined)).toBe('');
  });
});

describe('inventory slots', () => {
  it('keeps the raw slot index on every inventory item', () => {
    const { characters } = parseData(raw.data, raw.charNames, raw.companion, raw.guildData, raw.serverVars,
      raw.accountCreateTime);
    const inventory = characters?.find(({ inventory: inv }) => inv?.length > 1)?.inventory;
    expect(inventory?.every(({ slot }) => Number.isInteger(slot))).toBe(true);
    // Blanks are dropped from the list, so the slots have to be able to skip - a packed list would
    // point at the wrong square in game.
    expect(inventory.at(-1).slot).toBeGreaterThanOrEqual(inventory.length - 1);
  });
});
