// Maps an item/obol type string to the power stat it represents.
//
// Lives here rather than in obols.ts because it is a pure string mapping with no dependencies,
// while obols.ts imports items.ts, which reaches world-7/gallery.ts and from there misc.ts and
// its 32 parser imports. ItemDisplay needs only this function, and importing it from obols.ts
// pulled the entire parser graph onto every page rendering an item tooltip - including the 148
// public /tools/builds/* pages.
//
// obols.ts re-exports it, so existing importers are unaffected.
export const getPowerType = (type: string): string => {
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
