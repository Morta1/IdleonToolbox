import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { crafts } from '@website-data';
import { flattenCraftObject } from '@parsers/items';
import {
  addItemToPlan,
  addPlan,
  buildPlanView,
  getOwnedEquipCredits,
  getPlanMaterials,
  getUpgradeChain,
  getValidPlannerSections,
  removePlan,
  renamePlan,
  sanitizeCount,
  setItemCount
} from '@utility/itemPlanner';

// Militia_Helm -> Copper_Helmet (Equip, itself crafted from 20 Copper_Ore + 40 Bean_Slices)
// + 15 Iron_Bar + 80 Copper_Ore. Flattened: Copper_Ore 100, Bean_Slices 40, Copper_Helmet 1,
// Iron_Bar 15.
const militiaMaterials = flattenCraftObject(crafts['Militia_Helm']);
const scale = (materials, copies) => materials.map((item) => ({ ...item, itemQuantity: item.itemQuantity * copies }));
const owned = (name, amount, owner = 'Bob') => ({ name, owner, amount });
const plan = (itemName, itemQuantity = 1) => [{ itemName, itemQuantity }];
// Every material row of a view, chain tiers excluded, as [itemName, required, owned, state]
const rows = (view) => [...view.craftNext, ...view.gather, ...view.covered]
  .map(({ itemName, required, owned: have, state }) => [itemName, required, have, state])
  .sort(([a], [b]) => a.localeCompare(b));

describe('flattened Militia_Helm fixture', () => {
  it('matches the shape the tests below assume', () => {
    expect(militiaMaterials.map(({ itemName, itemQuantity, subType, type }) => [itemName, itemQuantity, subType,
      type])).toEqual([
      ['Copper_Ore', 100, 'ORE', 'Consumable'],
      ['Bean_Slices', 40, 'MONSTER_DROP', 'Quest'],
      ['Copper_Helmet', 1, 'HELMET', 'Equip'],
      ['Iron_Bar', 15, 'BAR', 'Item']
    ]);
  });
});

describe('getOwnedEquipCredits', () => {
  it('credits the sub-materials of an owned equip', () => {
    expect(getOwnedEquipCredits(militiaMaterials, [owned('Copper_Helmet', 1)]))
      .toEqual({ Copper_Ore: 20, Bean_Slices: 40 });
  });

  it('ignores equips you do not own', () => {
    expect(getOwnedEquipCredits(militiaMaterials, [owned('Copper_Ore', 999)])).toEqual({});
  });

  it('caps the credit at the number of copies actually required', () => {
    // 5 spare Copper_Helmets but only 1 is needed -> credit for exactly 1 copy
    expect(getOwnedEquipCredits(militiaMaterials, [owned('Copper_Helmet', 5)]))
      .toEqual({ Copper_Ore: 20, Bean_Slices: 40 });
  });

  it('scales the credit with the number of owned copies', () => {
    expect(getOwnedEquipCredits(scale(militiaMaterials, 3), [owned('Copper_Helmet', 2)]))
      .toEqual({ Copper_Ore: 40, Bean_Slices: 80 });
  });

  it('sums stacks of the same equip across owners', () => {
    expect(getOwnedEquipCredits(scale(militiaMaterials, 2), [owned('Copper_Helmet', 1, 'Bob'),
      owned('Copper_Helmet', 1, 'Storage')])).toEqual({ Copper_Ore: 40, Bean_Slices: 80 });
  });

  it('returns nothing for an equip with no craft recipe', () => {
    expect(getOwnedEquipCredits([{ itemName: 'Not_A_Craft', type: 'Equip', subType: 'HELMET', itemQuantity: 1 }],
      [owned('Not_A_Craft', 1)])).toEqual({});
  });

  it('handles empty and missing input', () => {
    expect(getOwnedEquipCredits([], [])).toEqual({});
    expect(getOwnedEquipCredits(undefined, undefined)).toEqual({});
  });
});

describe('getPlanMaterials', () => {
  it('derives materials from crafts, scaled by count', () => {
    expect(getPlanMaterials(plan('Militia_Helm', 2)).map(({ itemName, itemQuantity }) => [itemName, itemQuantity]))
      .toEqual([['Copper_Ore', 200], ['Bean_Slices', 80], ['Copper_Helmet', 2], ['Iron_Bar', 30]]);
  });

  it('merges materials shared by several tracked items', () => {
    const merged = getPlanMaterials([...plan('Militia_Helm'), ...plan('Militia_Helm', 2)]);
    expect(merged.find(({ itemName }) => itemName === 'Copper_Ore').itemQuantity).toBe(300);
  });

  it('skips tracked items that are no longer craftable', () => {
    expect(getPlanMaterials(plan('Not_A_Craft'))).toEqual([]);
    expect(getPlanMaterials(undefined)).toEqual([]);
  });
});

describe('getUpgradeChain', () => {
  it('walks the same-slot upgrade chain lowest first', () => {
    expect(getUpgradeChain('Crown_of_the_Gods').map(({ itemName }) => itemName)).toEqual([
      'Thin_Veil_of_The_Troll', 'Magma_Core_Headdress', 'Skulled_Helmet_of_the_Divine', 'Marbiglass_Headdress',
      'Crown_of_the_Gods']);
  });

  it('is just the item when nothing of its slot sits below it', () => {
    expect(getUpgradeChain('Copper_Helmet').map(({ itemName }) => itemName)).toEqual(['Copper_Helmet']);
  });
});

describe('buildPlanView', () => {
  it.each([
    ['nothing owned', 1, [], [
      ['Bean_Slices', 40, 0, 'short'], ['Copper_Helmet', 1, 0, 'short'], ['Copper_Ore', 100, 0, 'short'],
      ['Iron_Bar', 15, 0, 'short']]],
    // The reported bug: owning the intermediate Copper_Helmet must not wipe Copper_Ore out of the list
    ['the intermediate equip owned', 1, [owned('Copper_Helmet', 1)], [
      ['Bean_Slices', 0, 0, 'covered'], ['Copper_Ore', 80, 0, 'short'], ['Iron_Bar', 15, 0, 'short']]],
    ['5 spare intermediate equips', 1, [owned('Copper_Helmet', 5)], [
      ['Bean_Slices', 0, 0, 'covered'], ['Copper_Ore', 80, 0, 'short'], ['Iron_Bar', 15, 0, 'short']]],
    ['enough bars already', 1, [owned('Iron_Bar', 15)], [
      ['Bean_Slices', 40, 0, 'short'], ['Copper_Helmet', 1, 0, 'short'], ['Copper_Ore', 100, 0, 'short'],
      ['Iron_Bar', 15, 15, 'ready']]],
    ['some bars', 1, [owned('Iron_Bar', 5)], [
      ['Bean_Slices', 40, 0, 'short'], ['Copper_Helmet', 1, 0, 'short'], ['Copper_Ore', 100, 0, 'short'],
      ['Iron_Bar', 15, 5, 'short']]],
    // 3 helms wanted, 1 Copper_Helmet in hand -> one copy's worth of mats comes off
    ['3 helms and 1 intermediate owned', 3, [owned('Copper_Helmet', 1)], [
      ['Bean_Slices', 80, 0, 'short'], ['Copper_Helmet', 3, 1, 'short'], ['Copper_Ore', 280, 0, 'short'],
      ['Iron_Bar', 45, 0, 'short']]]
  ])('rows with %s', (_, count, inventory, expected) => {
    expect(rows(buildPlanView({ items: plan('Militia_Helm', count), inventoryItems: inventory }))).toEqual(expected);
  });

  it('puts the intermediate equip on the upgrade chain, not in the material lists', () => {
    const view = buildPlanView({ items: plan('Militia_Helm'), inventoryItems: [owned('Copper_Helmet', 1)] });
    expect(view.chains.map(({ goal, tiers }) => [goal, tiers.map(({ itemName, state }) => [itemName, state])]))
      .toEqual([['Militia_Helm', [['Copper_Helmet', 'owned'], ['Militia_Helm', 'goal']]]]);
    expect(view.craftNext).toEqual([]);
    expect(view.progress).toMatchObject({ ready: 0, total: 2, percent: 0 });
  });

  it('keeps a material needed at the top tier when two equips on one chain are owned', () => {
    // Prehistoric_Skull needs Nullo_Salt twice: 10000 inside Dreadnaught_Skull and 5000 of its own.
    const view = buildPlanView({ items: plan('Prehistoric_Skull'),
      inventoryItems: [owned('Crystal_Skull_of_Esquire_Vnoze', 1), owned('Cultist_Skull', 1)] });
    expect(rows(view)).toContainEqual(['Nullo_Salt', 5000, 0, 'short']);
  });

  it('does not depend on the order items were tracked in', () => {
    const items = [...plan('Militia_Helm'), ...plan('Copper_Helmet', 2)];
    const inventory = [owned('Copper_Helmet', 1)];
    expect(rows(buildPlanView({ items: [...items].reverse(), inventoryItems: inventory })))
      .toEqual(rows(buildPlanView({ items, inventoryItems: inventory })));
  });

  it('reads flurbos off the account instead of the inventory', () => {
    const flurbos = (account) => rows(buildPlanView({ items: plan('Cedar_Pendant'), account }))
      .find(([itemName]) => itemName === 'Dungeon_Credits_Flurbo_Edition');
    expect(flurbos({ dungeons: { flurbos: 10 } })).toEqual(['Dungeon_Credits_Flurbo_Edition', 30, 10, 'short']);
    expect(flurbos({ dungeons: { flurbos: 30 } })).toEqual(['Dungeon_Credits_Flurbo_Edition', 30, 30, 'ready']);
    expect(flurbos(undefined)).toEqual(['Dungeon_Credits_Flurbo_Edition', 30, 0, 'short']);
  });

  it('marks the owned tier, covers below it and names what the next tier is short of', () => {
    const view = buildPlanView({ items: plan('Crown_of_the_Gods'),
      inventoryItems: [owned('Marbiglass_Headdress', 1), owned('Caulifish', 1e9), owned('Royal_Fabric', 1e9),
        owned('Godshard_Bar', 195)] });
    expect(view.chains[0].tiers.map(({ state }) => state)).toEqual(['covered', 'covered', 'covered', 'owned', 'goal']);
    expect(view.chains[0].next).toBe('Crown_of_the_Gods');
    expect(view.chains[0].shortFor).toEqual([{ itemName: 'Godshard_Bar', rawName: 'GodshardBar', short: 49805 }]);
    expect(view.gather.map(({ itemName, state }) => [itemName, state])).toEqual([
      ['Godshard_Bar', 'short'], ['Caulifish', 'ready'], ['Royal_Fabric', 'ready']]);
    expect(view.craftNext).toEqual([]);
    expect(view.covered.length).toBeGreaterThan(0);
    expect(view.covered.every(({ state }) => state === 'covered')).toBe(true);
    // Progress counts materials only and leads with the scarcest one, not the share of ready rows
    expect(view.progress.ready).toBe(2);
    expect(view.progress.total).toBe(3);
    expect(view.progress.blocker.itemName).toBe('Godshard_Bar');
    expect(view.progress.percent).toBeCloseTo(0.39, 2);
  });

  it('renders logged out with nothing owned', () => {
    const view = buildPlanView({ items: plan('Crown_of_the_Gods') });
    expect(view.chains[0].tiers.map(({ state }) => state)).toEqual(['missing', 'missing', 'missing', 'missing', 'goal']);
    expect(view.chains[0].next).toBe('Thin_Veil_of_The_Troll');
    expect(view.covered).toEqual([]);
    expect(view.progress.ready).toBe(0);
    // Every tier still to build is listed, in the order it has to be crafted
    expect(view.craftNext.map(({ itemName }) => itemName)).toEqual(['Thin_Veil_of_The_Troll', 'Magma_Core_Headdress',
      'Skulled_Helmet_of_the_Divine', 'Marbiglass_Headdress']);
  });

  it('ignores legacy rows left at count 0 by the old minus button', () => {
    const empty = { chains: [], craftNext: [], gather: [], covered: [], progress: { ready: 0, total: 0, percent: 0, blocker: null } };
    expect(buildPlanView({ items: plan('Crown_of_the_Gods', 0) })).toEqual(empty);
  });

  it('lets two chains share one owned copy of a lower tier only once', () => {
    const view = buildPlanView({ items: [...plan('Militia_Helm'), ...plan('Thief_Hood')],
      inventoryItems: [owned('Copper_Helmet', 1)] });
    expect(view.chains.map(({ tiers }) => tiers[0].state)).toEqual(['owned', 'missing']);
  });

  it('returns an empty view for an empty, missing or uncraftable plan', () => {
    const empty = { chains: [], craftNext: [], gather: [], covered: [], progress: { ready: 0, total: 0, percent: 0, blocker: null } };
    expect(buildPlanView({ items: [] })).toEqual(empty);
    expect(buildPlanView({})).toEqual(empty);
    expect(buildPlanView({ items: plan('Not_A_Craft') })).toEqual(empty);
  });
});

describe('getValidPlannerSections', () => {
  it('drops tracked rows left at count 0 or below and keeps the rest', () => {
    const sections = getValidPlannerSections({ sections: [{ name: 'Old', items: [
      { itemName: 'Militia_Helm', itemQuantity: 2 }, { itemName: 'Cedar_Pendant', itemQuantity: 0 },
      { itemName: 'Thief_Hood', itemQuantity: -1 }], materials: [] }] });
    expect(sections[0].items.map(({ itemName }) => itemName)).toEqual(['Militia_Helm']);
  });
});

describe('plan edits', () => {
  it.each([['', 1], ['0', 1], [-3, 1], [2.5, 2], ['12', 12], [NaN, 1], [undefined, 1]])('sanitizeCount(%s) is %s',
    (value, expected) => {
      expect(sanitizeCount(value)).toBe(expected);
    });

  it('adds to an existing tracked item instead of duplicating it', () => {
    const once = addItemToPlan(addPlan([], ''), 0, 'Militia_Helm', 1);
    expect(addItemToPlan(once, 0, 'Militia_Helm', 2)[0].items)
      .toEqual([{ itemName: 'Militia_Helm', rawName: crafts.Militia_Helm.rawName, itemQuantity: 3 }]);
  });

  it('stores no materials, they are rebuilt from crafts', () => {
    expect(addItemToPlan(addPlan([], 'Gear'), 0, 'Militia_Helm', 1)[0].materials).toEqual([]);
  });

  it('sets a count and removes an item whose count drops to 0', () => {
    const plans = addItemToPlan(addPlan([], 'Gear'), 0, 'Militia_Helm', 1);
    expect(setItemCount(plans, 0, 'Militia_Helm', 4)[0].items[0].itemQuantity).toBe(4);
    expect(setItemCount(plans, 0, 'Militia_Helm', 0)[0].items).toEqual([]);
  });

  it('names a blank plan by position and keeps a name on blank rename', () => {
    const plans = addPlan(addPlan([], 'Gear'), '  ');
    expect(plans.map(({ name }) => name)).toEqual(['Gear', 'Plan 2']);
    expect(renamePlan(plans, 0, ' ')[0].name).toBe('Gear');
    expect(renamePlan(plans, 0, ' Tools ')[0].name).toBe('Tools');
  });

  it('removes only the chosen plan', () => {
    const plans = addPlan(addPlan(addPlan([], 'A'), 'B'), 'C');
    expect(removePlan(plans, 1).map(({ name }) => name)).toEqual(['A', 'C']);
  });

  it('ignores items that are not craftable', () => {
    const plans = addPlan([], 'Gear');
    expect(addItemToPlan(plans, 0, 'Not_A_Craft', 1)).toEqual(plans);
  });

  it('never edits the sections it was given', () => {
    const plans = Object.freeze([Object.freeze({ name: 'Gear', items: Object.freeze([]), materials: [] })]);
    expect(() => addItemToPlan(plans, 0, 'Militia_Helm', 1)).not.toThrow();
    expect(plans[0].items).toEqual([]);
  });
});
