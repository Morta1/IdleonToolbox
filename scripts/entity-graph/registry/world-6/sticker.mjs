import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable, listAt } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import researchSquare from '../world-7/research-square.mjs';

// The farmingStickersSquare table: FarmingStickersUnlocked is gated on this research square (ResearchStuff.js:409).
const unlockField = (data) => {
  const square = gameTable(data, 'farmingStickersSquare')?.square;
  const name = data.researchGridSquares?.[square]?.name;
  return name ? [linked({ label: 'Unlocked by', value: `${spaced(name)} research square` }, 'unlockedBy', nodeId(researchSquare, null, square))] : [];
};

export default {
  kind: 'sticker',
  // The per-sticker values are listIndexes.stickerValues (FarmingStuffs:StickerBonus); without them no bonus term is filled.
  // UPKEEP: research[23] holds the sticker names and [24] the texts. Not extracted: only a numbered event reads them (_event_7),
  // which no locator may anchor on.
  section: (data) => {
    const values = listAt(data.research, data, 'stickerValues');
    return data.research[23].map((name, t) => ({ name, description: data.research[24][t], value: values ? Number(values[t]) : null }));
  },
  key: (entry, index) => `Sticker${index}`,
  // UPKEEP: research[23] pads the sticker list with joke "Nonexistent_Sticker" rows.
  skip: (entry) => (entry.name === 'Nonexistent_Sticker' ? 'placeholder: joke sticker' : false),
  // UPKEEP: the Sticker Depot's art is keyed by sticker index (N.js:109964); the app draws it (World6/Farming/Stickers.jsx:43).
  icon: (entry, index) => `/data/FarmStickerB${index}.png`,
  fallbackIcon: '/data/FarmStickerB0.png',
  effect: (entry) => ({
    levelLabel: 'Stickers owned',
    cap: null,
    // UPKEEP: StickerBonus is value x stickers owned, before the Boony Crowns, event and superbit multipliers (FarmingStuffs.js:53-59).
    terms: entry.value === null ? [] : [
      { token: '{', formula: 'linear', args: { perLevel: entry.value } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.value / 100 } }
    ]
  }),
  fields: (entry, index, data) => unlockField(data)
};
