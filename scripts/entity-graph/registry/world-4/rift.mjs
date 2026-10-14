import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { tidy } from '../text.mjs';

// Field values render as written, so game names are spaced here.
const spaced = (text) => tidy(text).replace(/_/g, ' ');

// UPKEEP: every task ends on a live progress readout ("YOU'VE_DEFEATED_{_SO_FAR...", "YOUR_BEST_IS_{_SO_FAR..."); the text before it is the task.
const taskOf = (task) => String(task || '').replace(/_*@?_*(?:YOU'VE|YOU_HAVE|YOUR_BEST)_[^{]*\{.*$/, '');

// The game prints tasks in capitals. Sentence case, then the class names and AFK put back.
// "afk" sits between underscores, which \b never splits, so it is matched on them.
const sentenceCase = (text, classes) => {
  let out = text.toLowerCase().replace(/(^|\._)([a-z])/g, (match, lead, letter) => lead + letter.toUpperCase());
  // UPKEEP: the Basics classes are the shared novice names ("Rage_Basics") that no task prints; the other multi-word classes do appear.
  for (const name of (classes || []).filter((entry) => entry.includes('_') && !entry.endsWith('Basics'))) {
    out = out.split(name.toLowerCase()).join(name);
  }
  return out.replace(/(^|_)afk(?=[_.]|$)/g, '$1AFK');
};

// UPKEEP: RiftStuff("mobHP") (readable RiftStuff.js:7-16); r is Rift[0], so Rift N has r = N - 1.
const mobHP = (r) => 5e6 * Math.pow(1.11 + 0.02 * Math.min(1, r / 10) + 0.08 * Math.min(1, Math.max(0, r - 10) / 20)
  + 0.18 * Math.min(1, Math.max(0, r - 20) / 23), r);

export default {
  kind: 'rift',
  section: 'riftInfo',
  // UPKEEP: keyed by table position, which is the rift's number minus one in game too (the map banner prints "RIFT_" + (Rift[0] + 1)).
  key: (entry, index) => `Rift${index + 1}`,
  name: (entry, index) => `Rift_${index + 1}`,
  icon: (entry) => `/data/${entry.icon}.png`,
  fallbackIcon: '/data/Mface75.png',
  // UPKEEP: rows past the last real rift carry the game's "YOU_CANNOT_PROGRESS_FURTHER" task, a sentinel for levels not built yet.
  skip: (entry) => (/^YOU_CANNOT_PROGRESS_FURTHER/.test(entry.task) ? 'placeholder: no rift here yet' : false),
  describe: (entry, index, data) => sentenceCase(taskOf(entry.task), data.classes),
  fields: (entry, index) => [
    { label: 'Monster', value: spaced(entry.monsterName) },
    { label: 'Monster HP', value: formatAmount(mobHP(index)) }
  ]
};
