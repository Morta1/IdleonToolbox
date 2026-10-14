import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { spaced } from '../text.mjs';

// UPKEEP: PaletteBonus (GamingStatType.js:45-82): x5 = 1 is L / (L + 25) * x4, otherwise L * x4. `{` prints the bonus, `#` the same floored to hundredths, `}` 1 + bonus / 100.
const DECAY = 1;
const DECAY_OFFSET = 25;
// UPKEEP: LVupChance divides by x6 * max(1.2, x7 - 0.05)^L (GamingStatType.js:84-90).
const MIN_RATE = 1.2;
const RATE_OFFSET = 0.05;
// UPKEEP: palette slot -> the superbit index that doubles it (GamingStatType.js:62-68, gaming.ts:690). enrich-world-5.mjs reads the same map.
export const PALETTE_DOUBLERS = { 3: 58, 12: 61, 13: 51, 18: 54, 25: 49, 31: 52 };

const bonusTerm = (entry) => (entry.x5 === DECAY
  ? { formula: 'growth', args: { func: 'decay', x1: entry.x4, x2: DECAY_OFFSET } }
  : { formula: 'linear', args: { perLevel: entry.x4 } });
const flooredTerm = (entry) => (entry.x5 === DECAY
  ? { formula: 'decayFloorHundredths', args: { scale: entry.x4, offset: DECAY_OFFSET } }
  : { formula: 'linear', args: { perLevel: entry.x4 } });
const multiTerm = (entry) => (entry.x5 === DECAY
  ? { formula: 'growth', args: { func: 'decayMulti', x1: entry.x4 / 100, x2: DECAY_OFFSET } }
  : { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x4 / 100 } });

export default {
  kind: 'palette',
  section: 'gamingPalette',
  // UPKEEP: keyed by table position, which is the save's Spelunk[9] slot and the hex-grid position.
  key: (entry, index) => `Palette${index}`,
  // The tile and every page share the gaming menu icon until per-colour art exists.
  fallbackIcon: '/data/ClassIcons56.png',
  // UPKEEP: the game's own placeholder colours.
  skip: (entry) => (/^Nothing_yet/.test(entry.description) ? 'placeholder: no bonus yet' : false),
  effect: (entry) => ({
    levelLabel: 'Colour level',
    cap: null,
    terms: [{ token: '{', ...bonusTerm(entry) }, { token: '#', ...flooredTerm(entry) }, { token: '}', ...multiTerm(entry) }]
  }),
  cost: (entry) => {
    const rate = Math.max(MIN_RATE, entry.x7 - RATE_OFFSET);
    // Shifted one level so the line at level L is the roll from L to L + 1.
    return { formula: 'pow', args: { base: entry.x6 * rate, rate }, currency: '', label: 'Base odds of the next level', prefix: '1 in ', note: 'Before Palette Luck.' };
  },
  fields: (entry, index, data) => [
    // UPKEEP: x8 = 1 marks the three colours that are always available, so they have no unlock roll.
    ...(entry.x8 > 1 ? [{ label: 'Base unlock odds (before Palette Luck)', value: `1 in ${formatAmount(entry.x8)}` }] : []),
    ...(PALETTE_DOUBLERS[index] != null ? [{ label: 'Doubled by superbit', value: spaced(data.superbitsUpgrades?.[PALETTE_DOUBLERS[index]]?.name) }] : [])
  ]
};
