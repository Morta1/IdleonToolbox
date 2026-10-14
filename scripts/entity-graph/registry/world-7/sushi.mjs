import { formatAmount } from '../../../../utility/wiki/effects.mjs';

// UPKEEP: the bonus panel fills `{` with round(value) and `}` with MultiplierInfo(1 + value / 100) (N.js:122228); the wiki rounds the
// multiplier to two decimals as the opponent pages do.
const multiplierOf = (value) => Math.round((1 + value / 100) * 100) / 100;
const serviceOf = ({ service, value }) => service
  .split('{').join(formatAmount(Math.round(value)))
  .split('}').join(multiplierOf(value).toLocaleString('en-US', { maximumFractionDigits: 2 }));

export default {
  kind: 'sushi',
  // UPKEEP: research[30] names the sushi by tier, [36]/[37] are its Sushi Service bonus text and value, [33] its Knowledge type,
  // which indexes the texts in [34] and the per-level values in [35].
  section: (data) => data.research[30].map((name, t) => ({
    name,
    service: data.research[36][t],
    value: Number(data.research[37][t]),
    // UPKEEP: [33] is shorter than [30]; the game reads a missing type as type 0 (`0 | asNumber(undefined)`, SushiStuff.js:189-196,
    // N.js:122229), so the last tiers carry the first Knowledge bonus.
    type: Number(data.research[33][t]) || 0
  })),
  key: (entry, index) => `Sushi${index}`,
  icon: (entry, index) => `/data/Sushi${index}.png`,
  fallbackIcon: '/data/Sushi0.png',
  // "Knowledge Bonus" is the game's own term (Pepper Shaker: "its_Knowledge_Bonus_is_2x_bigger").
  describe: (entry, index, data) => `${serviceOf(entry)}@Knowledge_Bonus:_${data.research[34][entry.type]}`,
  effect: (entry, index, data) => {
    // UPKEEP: KnowledgeBonusSpecific (SushiStuff.js:189-196): per level x (1 + tier / 30); a Perfecto sushi doubles it (account).
    const per = Number(data.research[35][entry.type]) * (1 + index / 30);
    return {
      levelLabel: 'Knowledge level',
      cap: null,
      // UPKEEP: N.js:122229 fills `{` with CommaNotation, `}` with MultiplierInfo and `^` with NotateNumber "Small".
      terms: [
        { token: '{', formula: 'rounded', args: { formula: 'linear', args: { perLevel: per } } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: per / 100 } },
        { token: '^', formula: 'linear', args: { perLevel: per } }
      ]
    };
  },
  fields: (entry, index) => [{ label: 'Tier', value: index + 1 }]
};
