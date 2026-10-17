import { levelledText } from '../../../../utility/wiki/effects.mjs';
import { listAt } from '../data.mjs';

// UPKEEP: the panel fills `{` with CommaNotation(requirement) and `$` with NotateNumber(10^requirement, "Big") (N.js:124027).
// Not extracted: the fill is the panel's draw code, which no locator may anchor on.
const termsOf = (text, base, step) => [
  ...(text.includes('{') ? [{ token: '{', formula: 'floorPoly', args: { constant: base, perLevel: step } }] : []),
  ...(text.includes('$') ? [{ token: '$', formula: 'pow', args: { base: Math.pow(10, base), rate: Math.pow(10, step) } }] : [])
];

export default {
  kind: 'menageriemission',
  // listIndexes.menagerieMissions (MenagerieStuff UpgUnlocked); MenagerieStuff Cost arm 0 asks floor(base + step x claims),
  // the two lists listIndexes.menagerieMissionBase and menagerieMissionStep. No list, no requirement.
  section: (data) => {
    const base = listAt(data.research, data, 'menagerieMissionBase');
    const step = listAt(data.research, data, 'menagerieMissionStep');
    return (listAt(data.research, data, 'menagerieMissions') || []).map((text, index) => ({
      text,
      terms: base && step ? termsOf(text, Number(base[index]), Number(step[index])) : null
    }));
  },
  key: (entry, index) => `MenaMission${index}`,
  // The game names a mission by its text alone, so the page takes the text at its first requirement. A mission's short
  // name (research[55], "You have: N <name>") is no title: several are the names of whole systems (Farming Stickers).
  name: (entry) => (entry.terms ? levelledText({ description: entry.text, effect: { terms: entry.terms } }, 0) : null),
  icon: (entry, index) => `/data/MenaIconY${index}.png`,
  fallbackIcon: '/data/LumiJel.png',
  describe: (entry) => entry.text,
  effect: (entry) => (entry.terms ? { levelLabel: 'Times claimed', from: 0, terms: entry.terms } : undefined)
};
