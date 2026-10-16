import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { spaced } from '../text.mjs';

// The paletteBonus table (GamingStatType PaletteBonus): x5 = decayType is L / (L + decayOffset) * x4, otherwise L * x4.
// `{` prints the bonus, `#` the same floored to hundredths, `}` 1 + bonus / 100. No table, no bonus.
const bonusTerms = (entry, data) => {
  const bonus = gameTable(data, 'paletteBonus');
  if (!bonus) return [];
  if (entry.x5 !== bonus.decayType) {
    return [
      { token: '{', formula: 'linear', args: { perLevel: entry.x4 } },
      { token: '#', formula: 'linear', args: { perLevel: entry.x4 } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x4 / 100 } }
    ];
  }
  return [
    { token: '{', formula: 'growth', args: { func: 'decay', x1: entry.x4, x2: bonus.decayOffset } },
    { token: '#', formula: 'decayFloorHundredths', args: { scale: entry.x4, offset: bonus.decayOffset } },
    { token: '}', formula: 'growth', args: { func: 'decayMulti', x1: entry.x4 / 100, x2: bonus.decayOffset } }
  ];
};
// Palette slot to the superbit that doubles it, from the same table (the PaletteBonus doubler chain, gaming.ts:690);
// enrich-world-5.mjs reads it too.
export const paletteDoublers = (data) => gameTable(data, 'paletteBonus')?.doublers ?? {};

export default {
  kind: 'palette',
  section: 'gamingPalette',
  // UPKEEP: keyed by table position, which is the save's Spelunk[9] slot and the hex-grid position.
  key: (entry, index) => `Palette${index}`,
  // The game draws a colour as GamingHex.png with its white swapped for the colour's RGB; z-processing writes that
  // as etc/Palette_<index>.png (features/_tooling/wikiIcons.js). The gaming menu icon covers a missing file.
  icon: (entry, index) => `/etc/Palette_${index}.png`,
  fallbackIcon: '/data/ClassIcons56.png',
  // UPKEEP: the game's own placeholder colours.
  skip: (entry) => (/^Nothing_yet/.test(entry.description) ? 'placeholder: no bonus yet' : false),
  effect: (entry, index, data) => ({
    levelLabel: 'Colour level',
    cap: null,
    terms: bonusTerms(entry, data)
  }),
  // The paletteLevelUpChance table (GamingStatType LVupChance): x6 * max(minRate, x7 - rateOffset)^L. No table, no odds.
  cost: (entry, index, data) => {
    const chance = gameTable(data, 'paletteLevelUpChance');
    if (!chance) return null;
    const rate = Math.max(chance.minRate, entry.x7 - chance.rateOffset);
    // Shifted one level so the line at level L is the roll from L to L + 1.
    return { formula: 'pow', args: { base: entry.x6 * rate, rate }, currency: '', label: 'Base odds of the next level', prefix: '1 in ', note: 'Before Palette Luck.' };
  },
  fields: (entry, index, data) => {
    const doubler = paletteDoublers(data)[index];
    return [
      // UPKEEP: x8 = 1 marks the three colours that are always available, so they have no unlock roll.
      ...(entry.x8 > 1 ? [{ label: 'Base unlock odds (before Palette Luck)', value: `1 in ${formatAmount(entry.x8)}` }] : []),
      ...(doubler != null
        ? [linked({ label: 'Doubled by superbit', value: spaced(data.superbitsUpgrades?.[doubler]?.name) }, 'boostedBy', `superbit:Superbit${doubler}`)]
        : [])
    ];
  }
};
