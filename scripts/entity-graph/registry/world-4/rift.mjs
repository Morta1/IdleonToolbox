import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { tidy } from '../text.mjs';
import riftBonus from './rift-bonus.mjs';

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

// RiftStuff("mobHP") (the riftMobHP table): base x (rate plus each ramp's bonus x min(1, max(0, r - from) / span))^r, where r
// is Rift[0], so Rift N has r = N - 1. The ramps add in the game's order. No table, no HP.
const mobHP = (r, data) => {
  const hp = gameTable(data, 'riftMobHP');
  if (!hp) return null;
  const rate = hp.ramps.reduce((sum, { from, span, bonus }) => sum + bonus * Math.min(1, Math.max(0, r - from) / span), hp.rate);
  return hp.base * Math.pow(rate, r);
};

// UPKEEP: riftInfo carries no monster id, only monsterName, so the link is an exact, unique join on the monster table's Name; zero or several matches link nothing, and a partial match never does (Ghost is both ghost and pghost, so it stays plain).
const monsterOf = (entry, data) => {
  const matches = Object.entries(data.monsters || {}).filter(([, monster]) => monster?.Name === entry.monsterName);
  return matches.length === 1 ? `monster:${matches[0][0]}` : null;
};

const row = {
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
  fields: (entry, index, data) => {
    const hp = mobHP(index, data);
    return [
      linked({ label: 'Monster', value: spaced(entry.monsterName) }, 'features', monsterOf(entry, data)),
      { label: 'Monster HP', value: hp === null ? null : formatAmount(hp) },
      ...(entry.riftBonus
        ? [linked({ label: 'Rift bonus active from here', value: spaced(entry.riftBonus) }, 'unlocks', nodeId(riftBonus, entry, index, data))]
        : [])
    ];
  }
};

export default row;
