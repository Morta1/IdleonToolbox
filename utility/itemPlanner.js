import { crafts } from '@website-data';
import { findQuantityOwned, flattenCraftObject } from '@parsers/items';

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const objectsOnly = (list) => Array.isArray(list) ? list.filter(isPlainObject) : [];

const FLURBOS = 'Dungeon_Credits_Flurbo_Edition';

// Sections come from localStorage and user-picked import files, and render() maps over them,
// so a wrong shape would crash the page on every load
export const getValidPlannerSections = (planner) => objectsOnly(planner?.sections).map((section) => ({
  ...section,
  items: objectsOnly(section.items),
  materials: objectsOnly(section.materials)
}));

// Every copy of a craftable equip you already own is a copy you no longer have to build, so the
// materials that copy would have consumed drop out of the requirement. Credits are keyed by item
// name and gathered up front so the result doesn't depend on where the equip sits in the list.
//
// Equips on one upgrade chain are walked outermost-first, because an owned outer equip already
// accounts for every tier below it: crediting an inner one again would double-count the materials
// they share and hide a row that is still short. An ancestor's flattened recipe is a superset of
// its descendants', so recipe size orders the chain; unrelated chains never overlap.
export const getOwnedEquipCredits = (itemsList, inventoryItems) => {
  const equips = (itemsList ?? [])
    .filter((item) => item?.type === 'Equip')
    .map((item) => ({ item, recipe: flattenCraftObject(crafts[item?.itemName]) ?? [] }))
    .sort((a, b) => b.recipe.length - a.recipe.length);

  return equips.reduce((credits, { item, recipe }) => {
    const { amount } = findQuantityOwned(inventoryItems, item?.itemName);
    const stillToBuild = Math.max(0, (item?.itemQuantity ?? 0) - (credits[item?.itemName] ?? 0));
    const covered = Math.min(amount ?? 0, stillToBuild);
    if (covered <= 0) return credits;
    recipe.forEach(({ itemName, itemQuantity }) => {
      credits[itemName] = (credits[itemName] ?? 0) + (itemQuantity ?? 0) * covered;
    });
    return credits;
  }, {});
};

// Materials are always rebuilt from the current recipes, never read back from storage, so a game
// update that changes a recipe reaches plans saved before it. A tracked item's itemQuantity is its count.
export const getPlanMaterials = (items) => {
  const merged = new Map();
  (items ?? []).forEach((item) => {
    const recipe = crafts[item?.itemName];
    if (!recipe) return;
    const count = item?.itemQuantity ?? 0;
    flattenCraftObject(recipe).forEach((material) => {
      const quantity = (material?.itemQuantity ?? 0) * count;
      const existing = merged.get(material?.itemName);
      if (existing) existing.itemQuantity += quantity;
      else merged.set(material?.itemName, { ...material, itemQuantity: quantity });
    });
  });
  return [...merged.values()];
};

// A gear upgrade is crafted from the previous tier of the same slot, so following that one material
// down gives the whole ladder.
export const getUpgradeChain = (itemName) => {
  const chain = [];
  const seen = new Set();
  let current = crafts[itemName];
  while (current && !seen.has(current.itemName)) {
    seen.add(current.itemName);
    chain.unshift({ itemName: current.itemName, rawName: current.rawName });
    const { subType } = current;
    const lowerTier = current.materials?.find((material) => material?.type === 'Equip' && material?.subType === subType);
    current = lowerTier ? crafts[lowerTier.itemName] ?? lowerTier : null;
  }
  return chain;
};

const getOwned = (itemName, inventoryItems, account) => {
  if (itemName === FLURBOS) {
    return { amount: account?.dungeons?.flurbos ?? 0, owners: ['account'] };
  }
  const { amount, owner } = findQuantityOwned(inventoryItems ?? [], itemName);
  return { amount: amount ?? 0, owners: owner ?? [] };
};

const lastIndexWhere = (list, predicate) => list.reduce((found, entry, index) => predicate(entry) ? index : found, -1);
const shortFirst = (a, b) => (a.state === 'short' ? 0 : 1) - (b.state === 'short' ? 0 : 1) || a.order - b.order;
const withoutOrder = ({ order, ...row }) => row;

export const buildPlanView = ({ items, inventoryItems, account } = {}) => {
  const materials = getPlanMaterials(items);
  const credits = getOwnedEquipCredits(materials, inventoryItems ?? []);
  const rowsByName = new Map(materials.map(({ itemName, rawName, type, subType, itemQuantity }, order) => {
    const { amount, owners } = getOwned(itemName, inventoryItems, account);
    const required = Math.max(0, itemQuantity - (credits[itemName] ?? 0));
    const state = required <= 0 ? 'covered' : amount >= required ? 'ready' : 'short';
    return [itemName, { itemName, rawName, type, subType, required, owned: amount, owners, state, order }];
  }));

  const tierNames = new Set();
  const chains = (items ?? []).flatMap((item) => {
    const tiers = getUpgradeChain(item?.itemName);
    if (tiers.length < 2) return [];
    const count = item?.itemQuantity ?? 0;
    const lowerTiers = tiers.slice(0, -1);
    lowerTiers.forEach(({ itemName }) => tierNames.add(itemName));
    // The highest owned tier already contains every tier below it
    const ownedIndex = lastIndexWhere(lowerTiers, ({ itemName }) => getOwned(itemName, inventoryItems, account).amount >= count);
    const next = tiers[ownedIndex + 1].itemName;
    const shortFor = (crafts[next]?.materials ?? [])
      .filter(({ itemName }) => !tierNames.has(itemName) && rowsByName.get(itemName)?.state === 'short')
      .map(({ itemName }) => itemName);
    return [{
      goal: item.itemName,
      subType: crafts[item.itemName]?.subType,
      next,
      shortFor,
      tiers: tiers.map((tier, index) => ({
        ...tier,
        state: index === tiers.length - 1 ? 'goal' : index < ownedIndex ? 'covered' : index === ownedIndex ? 'owned' : 'missing'
      }))
    }];
  });

  const listed = [...rowsByName.values()].filter(({ itemName }) => !tierNames.has(itemName));
  const craftNext = listed.filter(({ type, state }) => type === 'Equip' && state !== 'covered').sort(shortFirst);
  const gather = listed.filter(({ type, state }) => type !== 'Equip' && state !== 'covered').sort(shortFirst);
  const covered = listed.filter(({ state }) => state === 'covered');
  const chainTiers = chains.flatMap(({ tiers }) => tiers).filter(({ state }) => state === 'owned' || state === 'missing');

  return {
    chains,
    craftNext: craftNext.map(withoutOrder),
    gather: gather.map(withoutOrder),
    covered: covered.map(withoutOrder),
    progress: {
      ready: [...craftNext, ...gather].filter(({ state }) => state === 'ready').length +
        chainTiers.filter(({ state }) => state === 'owned').length,
      total: craftNext.length + gather.length + chainTiers.length
    }
  };
};
