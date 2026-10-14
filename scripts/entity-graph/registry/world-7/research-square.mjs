import { dropReadout } from '../text.mjs';

// UPKEEP: the grid is 20 columns wide (ResearchStuff.js:290-315, square t sits at row floor(t / 20)).
const COLUMNS = 20;
// UPKEEP: square 31 (Smart Eye) is the one `$` that is not the bonus itself: Grid_Bonus(t, 2) is 25 per level (ResearchStuff.js:291-308).
const SMART_EYE = 31;
const SMART_EYE_PER_LEVEL = 25;
// UPKEEP: the account readouts the tooltip appends to squares 150 and 151 (N.js:121444); each cut keeps the sentence's own punctuation.
const READOUTS = [/_*Total_Reduction:-&%/, /_*@_*Total_Boost:\^x_POW/];
// UPKEEP: N.js:121444's no-companion branch for square 173. The game's own "." follows the `<`, so the `<.` pair is replaced as one.
const ARCTIS = 'You_are_now_permanently_linked_to_Arctis_on_all_characters.';

const cleaned = (text) => READOUTS.reduce((out, re) => out.replace(re, ''), dropReadout(text)).replace('<.', ARCTIS);

export default {
  kind: 'researchsquare',
  section: 'researchGridSquares',
  // UPKEEP: ResGridSquares placeholders are named "Name"; the game refuses to select them (N.js:107654).
  skip: (entry) => (entry.name === 'Name' ? 'placeholder: empty square' : false),
  key: (entry, index) => `ResGrid${index}`,
  // No per-square art exists (ResSq* are tile states): the Research menu tile stands in.
  fallbackIcon: '/data/ClassIcons61.png',
  describe: (entry) => cleaned(entry.description),
  effect: (entry, index) => ({
    levelLabel: 'Square level',
    cap: entry.maxLv,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.baseBonus } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.baseBonus / 100 } },
      { token: '|', formula: 'linear', args: { perLevel: 1 } },
      ...(index === SMART_EYE ? [{ token: '$', formula: 'linear', args: { perLevel: SMART_EYE_PER_LEVEL } }] : [])
    ]
  }),
  // Grid_PTSspent sums the levels: one Research Point each (ResearchStuff.js:278-289), no discounts exist.
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Research Points', note: 'One point per level.' }),
  fields: (entry, index) => [{ label: 'Grid position', value: `Row ${Math.floor(index / COLUMNS) + 1}, column ${(index % COLUMNS) + 1}` }]
};
