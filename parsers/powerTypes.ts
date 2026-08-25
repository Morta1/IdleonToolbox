// Maps an item/obol type string to the power stat it represents.
//
// Lives here rather than in obols.ts because it is a pure string mapping with no dependencies,
// while obols.ts imports items.ts, which reaches world-7/gallery.ts and from there misc.ts and
// its 32 parser imports. ItemDisplay needs only this function, and importing it from obols.ts
// pulled the entire parser graph onto every page rendering an item tooltip - including the 148
// public /tools/builds/* pages.
//
// obols.ts re-exports it, so existing importers are unaffected.

// An item's Type is what actually decides which power its Weapon_Power stat is. Matching on the
// UQ1txt string instead labelled 43 tools "Weapon Power", and got two of them backwards outright:
// Grumbie the Hatchet Hammer read "Mining Power" and the Skewered Snek pickaxe read "Weapon Power",
// because UQ1txt names a *different* stat the item happens to grant.
const POWER_BY_ITEM_TYPE: Record<string, string> = {
  PICKAXE: 'Mining Power',
  HATCHET: 'Choppin Power',
  FISHING_ROD: 'Fishing Power',
  BUG_CATCHING_NET: 'Catching Power',
  TRAP_BOX_SET: 'Trapping Power',
  WORSHIP_SKULL: 'Worship Power',
  DNA_SPLICER: 'Splice Power'
};

// `type` is the item's UQ1txt or rawName; `itemType` its Type, which is absent for obols and for
// callers that only ever hold the one string.
export const getPowerType = (type: string, itemType?: string): string => {
  if (itemType && POWER_BY_ITEM_TYPE[itemType]) return POWER_BY_ITEM_TYPE[itemType];
  let fixedType = type.toLowerCase();
  if (!fixedType) return 'Weapon Power';
  if (fixedType.includes('obolbronzeworship')) {
    return 'Worship Power';
  }
  if (fixedType.includes('obolbronzetrapping')) {
    return 'Trapping Power';
  }
  if (fixedType.includes('mining')) {
    return 'Mining Power';
  } else if (fixedType.includes('fishin')) {
    return 'Fishing Power';
  } else if (fixedType.includes('choppin')) {
    return 'Choppin Power';
  } else if (fixedType.includes('catch')) {
    return 'Catching Power';
  }
  return 'Weapon Power'
}
