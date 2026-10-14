import { titleCase } from '../text.mjs';

// UPKEEP: StudyBolaiaBonuses (Holes2.js:136): Justice (9) adds 50 from level 1, Bravery (3) is min(32, 12 + L * m) from level 1; Justice's 50 is the 1.5 base of its `}` multiplier.
const JUSTICE = 9;
const BRAVERY = 3;
const termsOf = (t, m) => {
  if (t === JUSTICE) return [{ token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1.5, x2: m / 100 } }];
  if (t === BRAVERY) return [{ token: '{', formula: 'affineCapped', args: { base: 12, perLevel: m, max: 32 } }];
  return [
    { token: '{', formula: 'linear', args: { perLevel: m } },
    { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: m / 100 } }
  ];
};
// UPKEEP: StudyReqForBolaia (Holes2.js:134): 4000 * 1.25^L, times 1.5 for each group of five caverns.
const studyBase = (t) => 4000 * Math.pow(1.5, Math.floor(t / 5));

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
  effect: (entry, index) => ({ levelLabel: 'Study level', cap: null, terms: termsOf(index, entry.perLevel) }),
  cost: (entry, index) => ({ formula: 'pow', args: { base: studyBase(index), rate: 1.25 }, currency: 'Study progress', note: 'No discounts apply; study rate bonuses only fill it faster.' }),
  // UPKEEP: CavernsOwned = min(18, ExplorerLV) (Holes.js:135), so cavern t opens at Explorer level t + 1.
  fields: (entry, index) => [{ label: 'Explorer level needed', value: index + 1 }]
};
