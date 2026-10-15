import { gameTable, listAt } from '../data.mjs';
import { fillBonus } from '../text.mjs';

const serviceOf = ({ service, value }) => fillBonus(service, value);

export default {
  kind: 'sushi',
  // listIndexes names the Sushi Service value (sushiServiceValues) and the Knowledge type (sushiKnowledgeTypes), which indexes the
  // texts (sushiKnowledgeTexts) and the per-level values (sushiKnowledgeValues). An absent one leaves its sentence or terms out.
  // UPKEEP: research[30] names the sushi by tier and [36] is its Sushi Service bonus text. Not extracted: only a numbered event
  // reads them (_event_12), which no locator may anchor on.
  section: (data) => {
    const values = listAt(data.research, data, 'sushiServiceValues');
    const types = listAt(data.research, data, 'sushiKnowledgeTypes');
    return data.research[30].map((name, t) => ({
      name,
      service: data.research[36][t],
      value: values ? Number(values[t]) : null,
      // UPKEEP: the type list is shorter than the names; the game reads a missing type as type 0 (`0 | asNumber(undefined)`,
      // SushiStuff.js:189-196, N.js:122229), so the last tiers carry the first Knowledge bonus.
      type: types ? Number(types[t]) || 0 : null
    }));
  },
  key: (entry, index) => `Sushi${index}`,
  icon: (entry, index) => `/data/Sushi${index}.png`,
  fallbackIcon: '/data/Sushi0.png',
  // "Knowledge Bonus" is the game's own term (Pepper Shaker: "its_Knowledge_Bonus_is_2x_bigger").
  describe: (entry, index, data) => {
    const texts = listAt(data.research, data, 'sushiKnowledgeTexts');
    return [
      entry.value === null ? null : serviceOf(entry),
      entry.type === null || !texts ? null : `Knowledge_Bonus:_${texts[entry.type]}`
    ].filter(Boolean).join('@');
  },
  effect: (entry, index, data) => {
    // The sushiKnowledgePerTier table, SushiStuff:KnowledgeBonusSpecific (N.js:107765): per level x (1 + tier / tierDivisor); a
    // Perfecto sushi doubles it (account). No table, no terms.
    const knowledge = gameTable(data, 'sushiKnowledgePerTier');
    const values = listAt(data.research, data, 'sushiKnowledgeValues');
    const per = knowledge && values && entry.type !== null ? Number(values[entry.type]) * (1 + index / knowledge.tierDivisor) : null;
    return {
      levelLabel: 'Knowledge level',
      cap: null,
      // UPKEEP: N.js:122229 fills `{` with CommaNotation, `}` with MultiplierInfo and `^` with NotateNumber "Small". Not extracted:
      // the print rule is the Knowledge panel's draw code (owner list: panel print rules).
      terms: per === null ? [] : [
        { token: '{', formula: 'rounded', args: { formula: 'linear', args: { perLevel: per } } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: per / 100 } },
        { token: '^', formula: 'notateSmall', args: { formula: 'linear', args: { perLevel: per } } }
      ]
    };
  },
  fields: (entry, index) => [{ label: 'Tier', value: index + 1 }]
};
