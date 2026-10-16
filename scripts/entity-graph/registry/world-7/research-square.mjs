import { gameTable } from '../data.mjs';
import { dropReadout } from '../text.mjs';

// The researchGridLabels table (the square panel's label, N.js:121443): square t is Number2Letter[letterOffset + t mod columns]
// and topRow - floor(t / columns), counting rows up from the bottom.
// UPKEEP: Number2Letter holds the capitals from index 27 on (read live: [27] is "A"); an offset outside them leaves the
// label out. Not extracted: Number2Letter is a game attribute N.js only reads, defined outside it.
const LETTERS_FROM = 27;
const CAPITALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const gridLabel = (index, labels) => {
  const letter = CAPITALS[labels.letterOffset - LETTERS_FROM + (index % labels.columns)];
  return letter ? `${letter}${labels.topRow - Math.floor(index / labels.columns)}` : null;
};
// UPKEEP: the account readouts the tooltip appends to squares 150 and 151 (N.js:121444); each cut keeps the sentence's own punctuation.
const READOUTS = [/_*Total_Reduction:-&%/, /_*@_*Total_Boost:\^x_POW/];
// UPKEEP: N.js:121444's no-companion branch for square 173. The game's own "." follows the `<`, so the `<.` pair is replaced as one.
// Not extracted: the sentence is tooltip text in the panel's draw code, with no table to locate.
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
  effect: (entry, index, data) => {
    // The researchSmartEye table (ResearchStuff Grid_Bonus(t, 2)): the one square whose `$` is not the bonus itself.
    const smartEye = gameTable(data, 'researchSmartEye');
    return {
      levelLabel: 'Square level',
      cap: entry.maxLv,
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.baseBonus } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.baseBonus / 100 } },
        { token: '|', formula: 'linear', args: { perLevel: 1 } },
        ...(index === smartEye?.square ? [{ token: '$', formula: 'linear', args: { perLevel: smartEye.perLevel } }] : [])
      ]
    };
  },
  // Grid_PTSspent sums the levels: one Research Point each (ResearchStuff.js:278-289), no discounts exist.
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Research Points', currencyOne: 'Research Point', note: 'One point per level.' }),
  fields: (entry, index, data) => {
    const labels = gameTable(data, 'researchGridLabels');
    return labels ? [{ label: 'Grid position', value: gridLabel(index, labels) }] : [];
  }
};
