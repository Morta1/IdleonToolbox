import { cleanUnderscore } from 'utility/helpers';

export const PRESET_SLOTS = 8;

export const emptyPreset = (name) => ({ name, cardSet: null, cards: Array(PRESET_SLOTS).fill(null) });

// Storage can hold anything (old shapes, hand edits) and card names a game update has since removed
export const normalizePresets = (storedPresets, catalogCards, cardSetsData) => {
  if (!Array.isArray(storedPresets)) return [];
  return storedPresets
    .filter((preset) => preset && typeof preset === 'object')
    .map((preset, index) => ({
      name: typeof preset.name === 'string' && preset.name.trim() ? preset.name : `Preset ${index + 1}`,
      cardSet: cardSetsData?.[preset.cardSet] ? preset.cardSet : null,
      cards: Array.from({ length: PRESET_SLOTS }, (_, slot) => {
        const displayName = Array.isArray(preset.cards) ? preset.cards[slot] : null;
        return catalogCards[displayName] ? displayName : null;
      })
    }));
};

const SET_PREFIX = 'Set:';

export const presetToText = (preset) => [
  preset.name,
  ...(preset.cardSet ? [`${SET_PREFIX} ${cleanUnderscore(preset.cardSet)}`] : []),
  preset.cards.filter(Boolean).map((displayName) => cleanUnderscore(displayName)).join(', ')
].join('\n');

const toKey = (name) => name?.toString().trim().toLowerCase().replace(/[\s_]+/g, '_');

// Reads presetToText output back, matching names by display name regardless of spaces, underscores or case
export const textToPreset = (text, catalogCards, cardSetsData) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const cardsByKey = Object.keys(catalogCards).reduce((res, name) => ({ ...res, [toKey(name)]: name }), {});
  const setsByKey = Object.keys(cardSetsData || {}).reduce((res, name) => ({ ...res, [toKey(name)]: name }), {});
  const nameLine = lines.find((line) => !line.startsWith(SET_PREFIX) && !line.includes(','));
  const setLine = lines.find((line) => line.startsWith(SET_PREFIX));
  const cardNames = lines.filter((line) => line !== nameLine && line !== setLine)
    .flatMap((line) => line.split(','))
    .map((name) => cardsByKey[toKey(name)]);
  const found = [...new Set(cardNames.filter(Boolean))].slice(0, PRESET_SLOTS);
  const unknown = cardNames.filter((name) => !name).length;
  return {
    preset: {
      name: nameLine || 'Pasted preset',
      cardSet: setsByKey[toKey(setLine?.slice(SET_PREFIX.length))] ?? null,
      cards: Array.from({ length: PRESET_SLOTS }, (_, slot) => found[slot] ?? null)
    },
    unknown
  };
};

// A character's in-game loadouts: the one equipped now (the only one the save keeps a card set for) and each saved preset
export const getCharacterLoadouts = (character) => {
  const toNames = (cardsList) => Array.from({ length: PRESET_SLOTS },
    (_, slot) => cardsList?.[slot]?.cardName ?? null);
  const equipped = {
    label: 'Equipped now',
    cardSet: character?.cards?.cardSet?.name ?? null,
    cards: toNames(character?.cards?.equippedCards)
  };
  const saved = (character?.cardPresets || []).map((cardsList, index) => ({
    label: `Preset ${index + 1}`,
    cardSet: null,
    cards: toNames(cardsList)
  }));
  return [equipped, ...saved].filter(({ cards }) => cards.some(Boolean));
};
