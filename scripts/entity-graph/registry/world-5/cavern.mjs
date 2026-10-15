import { gameTable } from '../data.mjs';
import { titleCase } from '../text.mjs';

// The studyBolaiaBonuses table (Holes2 StudyBolaiaBonuses): Justice adds `base` from level 1, the 1 + base / 100 start
// of its `}` multiplier; Bravery is min(max, base + L * m) from level 1. Without it no cavern can be told apart from
// those two, so no study bonus is filled.
const termsOf = (t, m, data) => {
  const study = gameTable(data, 'studyBolaiaBonuses');
  if (!study) return [];
  const { justice, bravery } = study;
  if (t === justice.cavern) return [{ token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1 + justice.base / 100, x2: m / 100 } }];
  if (t === bravery.cavern) return [{ token: '{', formula: 'affineCapped', args: { base: bravery.base, perLevel: m, max: bravery.max } }];
  return [
    { token: '{', formula: 'linear', args: { perLevel: m } },
    { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: m / 100 } }
  ];
};
// The studyReqForBolaia table (Holes2 StudyReqForBolaia): base * rate^L, times groupRate for each group of caverns.
const studyCost = (t, data) => {
  const req = gameTable(data, 'studyReqForBolaia');
  return req
    ? { formula: 'pow', args: { base: req.base * Math.pow(req.groupRate, Math.floor(t / req.groupSize)), rate: req.rate } }
    : null;
};
// The cavernsOwned table (Holes CavernsOwned = min(max, ExplorerLV)): cavern t opens at Explorer level t + 1, and one
// past the cap never opens through it.
const explorerLevel = (t, data) => {
  const owned = gameTable(data, 'cavernsOwned');
  return owned && t < owned.max ? t + 1 : null;
};

// UPKEEP: holesInfo[68] names the caverns, [69] holds the study text and [70] the study bonus per level.
export default {
  kind: 'cavern',
  section: (data) => (data.holesInfo?.[68] || []).map((name, t) => ({ name, study: data.holesInfo?.[69]?.[t], perLevel: Number(data.holesInfo?.[70]?.[t]) })),
  key: (entry, index) => `Cavern${index}`,
  name: (entry) => titleCase(entry.name),
  icon: (entry, index) => `/etc/Cavern_${index}.png`,
  fallbackIcon: '/data/Quest90.png',
  // UPKEEP: the two BRUH rows are the game's spare slots with no study.
  skip: (entry) => (!entry.study ? 'placeholder: no cavern here yet' : false),
  describe: (entry) => `Study:_${entry.study}`,
  effect: (entry, index, data) => ({ levelLabel: 'Study level', cap: null, terms: termsOf(index, entry.perLevel, data) }),
  cost: (entry, index, data) => {
    const cost = studyCost(index, data);
    return cost ? { ...cost, currency: 'Study progress', note: 'No discounts apply; study rate bonuses only fill it faster.' } : null;
  },
  fields: (entry, index, data) => [{ label: 'Explorer level needed', value: explorerLevel(index, data) }]
};
