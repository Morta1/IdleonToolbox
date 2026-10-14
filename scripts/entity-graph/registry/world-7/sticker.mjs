import { spaced } from '../text.mjs';

// UPKEEP: FarmingStickersUnlocked is gated on the Sticker Depot research square (ResearchStuff.js:409).
const STICKER_DEPOT = 88;

export default {
  kind: 'sticker',
  // UPKEEP: research[23] holds the sticker names, [24] the texts and [25] the per-sticker values.
  section: (data) => data.research[23].map((name, t) => ({ name, description: data.research[24][t], value: Number(data.research[25][t]) })),
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
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.value } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.value / 100 } }
    ]
  }),
  fields: (entry, index, data) => [{ label: 'Unlocked by', value: `${spaced(data.researchGridSquares[STICKER_DEPOT].name)} research square` }]
};
