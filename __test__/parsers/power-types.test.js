import { describe, it, expect } from 'vitest';
import { getPowerType } from '../../parsers/powerTypes';
import items from '../../data/website-data/items.json';

// The label keyed off UQ1txt, which is a *different* stat's name, so 43 tools read "Weapon Power".
// The item's Type is the thing that actually decides which power the stat is, so it wins.
describe('getPowerType by item type', () => {
  it.each([
    ['PICKAXE', 'Mining Power'],
    ['HATCHET', 'Choppin Power'],
    ['FISHING_ROD', 'Fishing Power'],
    ['BUG_CATCHING_NET', 'Catching Power'],
    ['TRAP_BOX_SET', 'Trapping Power'],
    ['WORSHIP_SKULL', 'Worship Power'],
    ['DNA_SPLICER', 'Splice Power']
  ])('labels a %s as %s', (type, expected) => {
    expect(getPowerType('EquipmentTools1', type)).toBe(expected);
  });

  // Grumbie is a hatchet whose UQ1txt is %_MINING_EFFICINCY, and Skewered Snek a pickaxe whose
  // UQ1txt is %_CHOP_EFFICIENCY. Both read as the wrong skill before the Type check.
  it('ignores a UQ1txt naming a different skill than the tool', () => {
    expect(getPowerType('%_MINING_EFFICINCY', 'HATCHET')).toBe('Choppin Power');
    expect(getPowerType('%_CHOP_EFFICIENCY', 'PICKAXE')).toBe('Mining Power');
  });

  it('leaves a real weapon alone', () => {
    expect(getPowerType('EquipmentBows1', 'BOW')).toBe('Weapon Power');
    expect(getPowerType('%_DEFENCE', 'HELMET')).toBe('Weapon Power');
  });

  // obols carry no tool Type, so they keep resolving by name the way they always have.
  it('still resolves obols by name', () => {
    expect(getPowerType('ObolBronzeWorship', 'CIRCLE_OBOL')).toBe('Worship Power');
    expect(getPowerType('ObolBronzeTrapping', 'CIRCLE_OBOL')).toBe('Trapping Power');
    expect(getPowerType('ObolBronzeMining')).toBe('Mining Power');
  });

  // Guards the whole fix against a regeneration adding a tool the map does not know about.
  it('gives every tool item a non-weapon power', () => {
    const tools = Object.entries(items)
      .filter(([, item]) => item.Weapon_Power && /PICKAXE|HATCHET|FISHING_ROD|BUG_CATCHING_NET|TRAP_BOX_SET|WORSHIP_SKULL|DNA_SPLICER/.test(item.Type))
      .filter(([rawName, item]) => getPowerType(item.UQ1txt || rawName, item.Type) === 'Weapon Power');
    expect(tools.map(([rawName]) => rawName)).toEqual([]);
  });
});
