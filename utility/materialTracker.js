// Imports are user-supplied files, so anything without an item is dropped rather than rendered
export const isValidTrackedMaterial = (entry) => typeof entry?.item?.rawName === 'string';

export const getValidTrackedMaterials = (trackedItems) => {
  if (!trackedItems || typeof trackedItems !== 'object' || Array.isArray(trackedItems)) return {};
  return Object.fromEntries(Object.entries(trackedItems).filter(([, entry]) => isValidTrackedMaterial(entry)));
};

const PLACEHOLDER_ITEM = /ERROR|Blank|Filler|DONTFILL|FILLER/;

// The items the material tracker has always offered: no gear, no placeholder rows
export const isTrackableItem = ({ displayName, rawName, itemType } = {}) =>
  itemType !== 'Equip' && !PLACEHOLDER_ITEM.test(displayName ?? '') && !PLACEHOLDER_ITEM.test(rawName ?? '');
