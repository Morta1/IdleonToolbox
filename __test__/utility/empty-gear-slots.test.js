import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getEquipmentAlert } from '../../utility/dashboard/characters';

const options = (value) => ({
  equipment: {
    availableUpgradesSlots: { name: 'availableUpgradesSlots', checked: false },
    emptyGearSlots: { name: 'emptyGearSlots', type: 'array', checked: true, props: { value } }
  }
});

const equipment = (overrides = {}) => {
  const base = ['EquipmentHats1', 'EquipmentSword1', 'EquipmentShirts1', 'EquipmentPendant1',
    'EquipmentPants1', 'EquipmentRings1', 'EquipmentShoes1', 'EquipmentRings1',
    'Blank', 'Blank', 'Blank', 'Blank', 'Blank', 'Blank', 'Blank', 'Blank'];
  return base.map((rawName, index) => ({ rawName: overrides[index] ?? rawName }));
};

describe('empty gear slots alert', () => {
  const defaults = { weapon: true, armor: true, amulet: false, rings: false };

  it('is empty when everything on page 1 is equipped', () => {
    const alerts = getEquipmentAlert({}, [], { equipment: equipment() }, 0, options(defaults));
    expect(alerts.emptyGearSlots).toEqual([]);
  });

  it('flags weapon and armor by default', () => {
    const char = { equipment: equipment({ 1: 'Blank', 4: 'Blank' }) };
    const alerts = getEquipmentAlert({}, [], char, 0, options(defaults));
    expect(alerts.emptyGearSlots).toEqual(['Weapon', 'Pants']);
  });

  it('ignores amulet and rings unless enabled', () => {
    const char = { equipment: equipment({ 3: 'Blank', 5: 'Blank', 7: 'Blank' }) };
    expect(getEquipmentAlert({}, [], char, 0, options(defaults)).emptyGearSlots).toEqual([]);
    expect(getEquipmentAlert({}, [], char, 0, options({ ...defaults, amulet: true, rings: true })).emptyGearSlots)
      .toEqual(['Pendant', 'Ring', 'Ring']);
  });

  it('never looks at page 2, tools or food', () => {
    const char = { equipment: equipment(), tools: [{ rawName: 'Blank' }], food: [] };
    expect(getEquipmentAlert({}, [], char, 0, options({ ...defaults, amulet: true, rings: true })).emptyGearSlots)
      .toEqual([]);
  });

  it('handles a character with no equipment data', () => {
    expect(getEquipmentAlert({}, [], {}, 0, options(defaults)).emptyGearSlots).toEqual([]);
  });

  it('returns nothing when the option is off', () => {
    const char = { equipment: equipment({ 1: 'Blank' }) };
    const alerts = getEquipmentAlert({}, [], char, 0, { equipment: {} });
    expect(alerts.emptyGearSlots).toBeUndefined();
  });
});
