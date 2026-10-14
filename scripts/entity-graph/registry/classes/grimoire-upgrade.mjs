import { spaced } from '../text.mjs';
import { classField, unlocksAt } from './fields.mjs';

// UPKEEP: GrimoireUpgCost is 3 x 1.05^t x (L + (x1 + L) x (x2 + 0.01)^L), before the masterclass discounts (N.js:106375).
const COST_SCALE = 3;
const COST_INDEX_RATE = 1.05;
const COST_RATE_BUMP = 0.01;
// UPKEEP: the panel prints "Lv x/max" only below 999 (N.js:111984).
const UNCAPPED_FROM = 999;
// UPKEEP: the panel prints the multiplier as MultiplierInfo below a bonus of 1,000 and as CommaNotation(floor(1 + bonus / 100)) from it, so the floor starts at a multiplier of 11 (N.js:111973).
const FLOOR_FROM = 11;
// UPKEEP: plurals from the game's "<bone>s owned" descriptions; the bones drop as the items Bone0 to Bone3 (DropSomething.js:9).
const BONES = [['Femurs', 'Femur'], ['Ribcages', 'Ribcage'], ['Craniums', 'Cranium'], ['Bovinae', null]];
// UPKEEP: GrimoireUpgBonus skips the Writhing Grimoire multiplier for these rows (N.js:106384); the panel marks them with a "G" (N.js:111965).
const NOT_WRITHED = new Set([9, 11, 17, 26, 32, 36, 39, 45]);
// UPKEEP: index of Writhing Grimoire in the Grimoire table (N.js:106384).
const WRITHING = 36;
// UPKEEP: rows 13, 21 and 31 fill `$` with the next target of the RANDOlist[104] ladder (N.js:111974).
const LADDER = new Set([13, 21, 31]);
const LADDER_LIST = 104;
// UPKEEP: the ladder rows end in "_Target:$", which is an account readout (N.js:111974).
const LADDER_TAIL = /_Target:\$$/;
// UPKEEP: the Death Bringer owns Wraith Form and the Grimoire (research section 7).
const CLASS = 'Death_Bringer';
// UPKEEP: the shared hover help of rows 24, 35, 39 and 44 (N.js:111988).
const EVERYONE = 'This bonus affects all your players, all the time! It has nothing to do with Wraith Form or your Death Bringer.';
// UPKEEP: hover help (N.js:111988).
const NOTES = {
  0: 'Enter Wraith Form using the other Talent. It lets you get bones from killing monsters! Exit Wraith Form by reusing the talent.',
  5: 'You only get ribbons on days you play IdleOn. If your Shelf is full, the new ribbon will try to combine with another.',
  13: 'A Knockout, or KO, is when you kill the target monster in a single hit using your bare hands, no spears allowed!',
  21: 'An Elimination is when you defeat the entire map of target monsters before any of them respawn!',
  24: EVERYONE,
  31: 'An Annihilation is when you defeat 200 target monsters within 60 seconds of entering their map!',
  35: EVERYONE,
  39: EVERYONE,
  44: EVERYONE
};

export default {
  kind: 'grimoireupgrade',
  section: 'grimoire',
  key: (entry, index) => `GrimoireUpg${index}`,
  // UPKEEP: the numbered rows carry a "_(#)" stack count readout (N.js:111965).
  name: (entry) => entry.name.replace(/_\(#\)$/, ''),
  icon: (entry, index) => `/data/GrimoireUpg${index}.png`,
  fallbackIcon: '/data/GrimoireUpg18.png',
  // UPKEEP: unreleased rows are named Ripped_Page ("These pages are missing...").
  skip: (entry) => (entry.name === 'Ripped_Page' ? 'placeholder: missing page' : false),
  describe: (entry, index) => (LADDER.has(index) ? entry.description.replace(LADDER_TAIL, '') : entry.description),
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: entry.x4 < UNCAPPED_FROM ? entry.x4 : null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.x5 } },
      { token: '}', formula: 'rounded', args: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x5 / 100 }, mode: 'floor', from: FLOOR_FROM } }
    ]
  }),
  cost: (entry, index) => ({
    formula: 'notateBig',
    args: { formula: 'affinePowPlusLevel', args: { scale: COST_SCALE * Math.pow(COST_INDEX_RATE, index), base: entry.x1, rate: entry.x2 + COST_RATE_BUMP } },
    currency: BONES[entry.boneType][0],
    ...(BONES[entry.boneType][1] ? { currencyOne: BONES[entry.boneType][1] } : {})
  }),
  costs: (entry) => [{ item: `Bone${entry.boneType}` }],
  fields: (entry, index, data) => [
    classField(CLASS),
    // UPKEEP: GrimoireUpgUNLOCKED counts the rows by unlockLevel against the total; the panel's locked line is N.js:111986.
    unlocksAt(entry.unlockLevel, 'Grimoire'),
    NOT_WRITHED.has(index) ? null : { label: 'Boosted by', value: spaced(data.grimoire[WRITHING].name) },
    LADDER.has(index)
      ? { label: 'Targets', value: `${data.randomList[LADDER_LIST].length} targets in turn, starting with ${spaced(data.monsters[data.randomList[LADDER_LIST][0]].Name)}` }
      : null,
    NOTES[index] ? { label: 'Note', value: NOTES[index] } : null
  ].filter(Boolean)
};
