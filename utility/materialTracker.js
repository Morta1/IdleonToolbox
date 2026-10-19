// Imports are user-supplied files, so anything without an item is dropped rather than rendered
export const isValidTrackedMaterial = (entry) => typeof entry?.item?.rawName === 'string';

export const getValidTrackedMaterials = (trackedItems) => {
  if (!trackedItems || typeof trackedItems !== 'object' || Array.isArray(trackedItems)) return {};
  return Object.fromEntries(Object.entries(trackedItems).filter(([, entry]) => isValidTrackedMaterial(entry)));
};

// useLocalStorage swallows QuotaExceededError, so a full origin quota only shows up on read-back
export const isStoredInLocalStorage = (key, value) => {
  try {
    return localStorage.getItem(key) === JSON.stringify(value);
  } catch {
    return false;
  }
};
