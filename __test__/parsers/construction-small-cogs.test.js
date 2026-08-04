import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCogDisplayName, getSmallCogUpgrades, LEFT_COL_INDEX, RIGHT_COL_INDEX, SPARE_START_INDEX } from '@parsers/world-3/construction';
import { cogSlotLabel } from '@parsers/world-3/constructionOptimizer';

// CogSm<letter><level>: '_' flaggy, 'a' build, 'b' construction XP.
const sideSlot = (name, originalIndex, overrides = {}) => ({
  currentAmount: 10,
  requiredAmount: 10,
  flagPlaced: false,
  cog: { name, originalIndex },
  ...overrides
});

// 24 side slots, left then right, mirroring how parseFlags concatenates the two columns.
const makeSideSlots = (names) => names.map((name, index) => sideSlot(
  name,
  index < 12 ? LEFT_COL_INDEX + index : RIGHT_COL_INDEX + (index - 12)
));

const makeOrder = (sideNames, spareNames = []) => {
  const order = new Array(252).fill('Blank');
  sideNames.forEach((name, index) => {
    order[index < 12 ? LEFT_COL_INDEX + index : RIGHT_COL_INDEX + (index - 12)] = name;
  });
  spareNames.forEach((name, index) => { order[SPARE_START_INDEX + 12 + index] = name; });
  return order;
};

describe('small cog upgrades', () => {
  it('reports a stronger inventory cog of the same type', () => {
    // Every slot full, so the spare has to displace something rather than fill a hole.
    const side = new Array(24).fill('CogSma6');
    side[0] = 'CogSma4';
    const { upgrades, freeSlots } = getSmallCogUpgrades(makeOrder(side, ['CogSma9']), makeSideSlots(side));

    expect(freeSlots).toBe(0);
    const swap = upgrades.find(({ replaces }) => replaces);
    expect(swap.name).toBe('CogSma9');
    // It displaces the weakest placed cog of that type, not just any of them.
    expect(swap.replaces.name).toBe('CogSma4');
    expect(swap.type).toBe('build');
    expect(swap.slotLabel).toBe('Left #1');
    expect(swap.gainPercent).toBeGreaterThan(0);
  });

  it('never suggests swapping across types', () => {
    const side = new Array(24).fill('Blank');
    side[0] = 'CogSm_1'; // weak flaggy cog
    // A far stronger build cog must not be offered as a replacement for it.
    const { upgrades } = getSmallCogUpgrades(makeOrder(side, ['CogSma9']), makeSideSlots(side));

    expect(upgrades.every((upgrade) => !upgrade.replaces || upgrade.replaces.type === upgrade.type)).toBe(true);
  });

  it('ignores an inventory cog that is weaker than what is placed', () => {
    const side = new Array(24).fill('Blank');
    side.fill('CogSma9', 0, 24);
    const { upgrades, freeSlots } = getSmallCogUpgrades(makeOrder(side, ['CogSma1']), makeSideSlots(side));

    expect(freeSlots).toBe(0);
    expect(upgrades).toHaveLength(0);
  });

  it('offers empty slots before swaps, so a strong cog is not spent on a marginal gain', () => {
    const side = new Array(24).fill('Blank');
    side[0] = 'CogSma4';
    const { upgrades, freeSlots } = getSmallCogUpgrades(makeOrder(side, ['CogSma9']), makeSideSlots(side));

    expect(freeSlots).toBe(23);
    // The one spare fills an empty slot rather than displacing the CogSma4.
    expect(upgrades).toHaveLength(1);
    expect(upgrades[0].replaces).toBeNull();
  });

  it('does not count locked or flag-building slots as free', () => {
    const side = new Array(24).fill('Blank');
    const slots = makeSideSlots(side);
    slots[0] = { ...slots[0], flagPlaced: true };
    slots[1] = { ...slots[1], currentAmount: 0, requiredAmount: 100 };
    const { freeSlots } = getSmallCogUpgrades(makeOrder(side, []), slots);

    expect(freeSlots).toBe(22);
  });

  it('collects every small cog sitting in the inventory', () => {
    const side = new Array(24).fill('Blank');
    const { spares } = getSmallCogUpgrades(makeOrder(side, ['CogSma4', 'CogSm_3', 'CogSmb7']), makeSideSlots(side));

    expect(spares.map(({ type }) => type).sort()).toEqual(['build', 'constructionXp', 'flaggy']);
  });
});

describe('cog display names', () => {
  // Mirrors the game's own naming (N.js:67410): tier from character 4, kind from characters 5-6.
  it.each([
    ['Cog3B0', 'Ulti Double Cog'],
    ['Cog3A00', 'Ulti Cog'],
    ['Cog0A1', 'Nooby Average Cog'],
    ['Cog1B3', 'Decent Quad Cog'],
    ['Cog2A4', 'Superb Deckered Cog'],
    ['Cog3co', 'Ulti Collumm Cog'],
    ['Cog3le', 'Ulti Leff Cog'],
    ['Cog3ri', 'Ulti Rite Cog'],
    ['Cog3up', 'Ulti Uppy Cog'],
    ['Cog3do', 'Ulti Downer Cog'],
    ['CogCry0', 'Topaz Cog'],
    ['CogCry4', 'Emerald Cog'],
    ['CogY', 'Yang Cog'],
    ['CogSm_5', 'Tiny T6 Flaggy Cog'],
    ['CogSma4', 'Tiny T5 Build Cog'],
    ['CogSmb8', 'Tiny T9 XP Cog'],
    ['CogZA00', 'Excogia piece 1'],
    ['CogZA03', 'Excogia piece 4'],
    ['Player_Morojoze', 'Morojoze'],
    ['Blank', 'Blank']
  ])('names %s as %s', (raw, expected) => {
    expect(getCogDisplayName(raw)).toBe(expected);
  });
});

describe('cog slot labels', () => {
  it.each([
    [0, 'R1C1'],
    [11, 'R1C12'],
    [95, 'R8C12'],
    [96, 'Chars R1C1'],
    [98, 'Chars R1C3'],
    [107, 'Chars R4C3'],
    [108, 'Inv P1 R1C1'],
    [122, 'Inv P1 R5C3'],
    [123, 'Inv P2 R1C1'],
    [227, 'Inv P8 R5C3']
  ])('labels index %i as %s', (index, expected) => {
    expect(cogSlotLabel(index)).toBe(expected);
  });

  it('falls back when there is no index at all', () => {
    expect(cogSlotLabel(null)).toBe('Inventory');
  });
});
