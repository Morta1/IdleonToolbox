import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { spaced } from '../text.mjs';

// The observationInsightReq table (ResearchStuff ObservationInsightExpREQ): (base + perIndex t) x (1 + t^2 / squareDivisor)
// x (rateBase + t / rateDivisor)^L + L, t the table index.
const insightBase = (t, req) => (req.base + req.perIndex * t) * (1 + (t * t) / req.squareDivisor);
const insightRate = (t, req) => req.rateBase + t / req.rateDivisor;
// The observationExpRate table (ResearchStuff ResearchEXPrateObj): the Research EXP one Magnifier earns, before Game Design
// 101 and the Kaleidoscopes. The game writes (t / 15) x 0.4; the wiki keeps its own (0.4 t) / 15, which prints the same.
const magnifierExp = (t, rate) => (rate.base + t / rate.halfDivisor + Math.floor(t / rate.quarterDivisor))
  * (1 + Math.pow(t, 1 + (rate.growthScale * t) / rate.growthDivisor) / rate.growthShrink) + Math.pow(t, rate.tailPower) + rate.tailScale * t;

export default {
  kind: 'observation',
  section: 'researchOccurrences',
  // UPKEEP: the unreleased rows of the N.js `Occurrences` table are named "Name".
  skip: (entry) => (entry.name === 'Name' ? 'placeholder: no observation yet' : false),
  key: (entry, index) => `ResObs${index}`,
  // UPKEEP: ResObj<n>.png is keyed by table position, as the app draws it (research.ts:258).
  icon: (entry, index) => `/data/ResObj${index}.png`,
  fallbackIcon: '/data/ResObj0.png',
  // The data hint has no full stop of its own. With no requirement table the Insight sentence goes too.
  describe: (entry, index, data) => (gameTable(data, 'observationInsightReq')
    ? `${entry.description}.@Insight_EXP_for_the_next_level:_{`
    : `${entry.description}.`),
  effect: (entry, index, data) => {
    const req = gameTable(data, 'observationInsightReq');
    return {
      levelLabel: 'Insight level',
      cap: null,
      terms: req ? [{ token: '{', formula: 'powPlusLevel', args: { base: insightBase(index, req), rate: insightRate(index, req) } }] : []
    };
  },
  fields: (entry, index, data) => {
    const rate = gameTable(data, 'observationExpRate');
    return [
      linked({ label: 'Found in', value: spaced(data.mapNames[entry.mapId]) }, 'locatedIn', `map:${entry.mapId}`),
      { label: 'Research level needed', value: entry.researchLvReq },
      rate ? { label: 'Research EXP per Magnifier', value: magnifierExp(index, rate), format: 'amount' } : null
    ].filter(Boolean);
  }
};
