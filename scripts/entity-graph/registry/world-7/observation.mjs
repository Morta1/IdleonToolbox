import { formatAmount } from '../../../../utility/wiki/effects.mjs';

const spaced = (text) => String(text || '').replace(/_/g, ' ').trim();
// UPKEEP: ObservationInsightExpREQ is (2 + 0.7t) x (1 + t^2 / 100) x (1.75 + t / 200)^L + L (ResearchStuff.js:142-147), t the table index.
const insightBase = (t) => (2 + 0.7 * t) * (1 + (t * t) / 100);
const insightRate = (t) => 1.75 + t / 200;
// UPKEEP: the Research EXP one Magnifier earns, before Game Design 101 and the Kaleidoscopes (ResearchStuff.js:100-120).
const magnifierExp = (t) => (4 + t / 2 + Math.floor(t / 4)) * (1 + Math.pow(t, 1 + (0.4 * t) / 15) / 10) + Math.pow(t, 1.5) + 1.5 * t;

export default {
  kind: 'observation',
  section: 'researchOccurrences',
  // UPKEEP: the unreleased rows of the N.js `Occurrences` table are named "Name".
  skip: (entry) => (entry.name === 'Name' ? 'placeholder: no observation yet' : false),
  key: (entry, index) => `ResObs${index}`,
  // UPKEEP: ResObj<n>.png is keyed by table position, as the app draws it (research.ts:258).
  icon: (entry, index) => `/data/ResObj${index}.png`,
  fallbackIcon: '/data/ResObj0.png',
  // The data hint has no full stop of its own.
  describe: (entry) => `${entry.description}.@Insight_EXP_for_the_next_level:_{`,
  effect: (entry, index) => ({
    levelLabel: 'Insight level',
    cap: null,
    terms: [{ token: '{', formula: 'powPlusLevel', args: { base: insightBase(index), rate: insightRate(index) } }]
  }),
  fields: (entry, index, data) => [
    { label: 'Found in', value: spaced(data.mapNames[entry.mapId]) },
    { label: 'Research level needed', value: entry.researchLvReq },
    { label: 'Research EXP per Magnifier', value: formatAmount(magnifierExp(index)) }
  ]
};
