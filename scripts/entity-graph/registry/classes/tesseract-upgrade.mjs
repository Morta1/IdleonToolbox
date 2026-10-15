import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import { classField, unlocksAt } from './fields.mjs';

// UPKEEP: ArcaneUpgCost is 3 x 1.04^t x (L + (x1 + L) x (x2 + 0.01)^L), before the masterclass and Massivon Hoarding discounts (N.js:107167).
const COST_SCALE = 3;
const COST_INDEX_RATE = 1.04;
const COST_RATE_BUMP = 0.01;
// UPKEEP: the panel prints "Lv x/max" only below 999 (N.js:118290).
const UNCAPPED_FROM = 999;
// UPKEEP: the panel prints the multiplier as MultiplierInfo below a bonus of 1,000 and as CommaNotation(floor(1 + bonus / 100)) from it, so the floor starts at a multiplier of 11 (N.js:118290).
const FLOOR_FROM = 11;
// UPKEEP: OptionsListAccount[388 + x3] holds the tachyons; the colours are the game's "<colour> Tachyons owned" words (row 12 says "Purple Tachyon owned") on rows 12, 27, 34, 41, 49 and 56, matching the parser's tachyonNames (tesseract.ts:24-31).
const TACHYONS = ['Purple', 'Brown', 'Green', 'Red', 'Silver', 'Gold'];
// UPKEEP: ArcaneUpgBonus skips the Fractal Tesseract multiplier for these rows (N.js:107159).
const NOT_FRACTAL = new Set([3, 7, 8, 10, 13, 16, 20, 25, 26, 28, 33, 35, 39, 40, 43, 45, 48, 57, 58]);
// UPKEEP: index of Fractal Tesseract in the Tesseract table (N.js:107159).
const FRACTAL = 39;
// UPKEEP: the Tesseract is the shop of Arcanist Form, the Arcane Cultist's talent 585 (TesseractArcanist, N.js:63981).
const CLASS = 'Arcane_Cultist';
// UPKEEP: row 3 fills `$` with 1 / PrismaBubDropChance, which is 1,000 with no bubble found, no Drop Rate Crossfire and no Primo Prisma talent 594 (N.js:107169, ArcaneType.js:74-85).
const PRISMA_ODDS = 3;
const PRISMA_BASE_ODDS = '1,000';
// UPKEEP: the `$` the panel computes per row (N.js:118290, ArcaneType.js:110-118, 228-234): Tenteyecle Nostalgia (7) and Beyond All Limits (58)
// are the bonus itself, Arcane Charging (13) counts down from 200, Astrology Cultism (40) and Pinnacle of Prisma (45) add to 1.10 and 2.
const DOLLAR = {
  7: (entry) => ({ formula: 'linear', args: { perLevel: entry.x5 } }),
  13: (entry) => ({ formula: 'growth', args: { func: 'reduce', x1: 200, x2: entry.x5 } }),
  40: (entry) => ({ formula: 'growth', args: { func: 'bigBase', x1: 1.1, x2: entry.x5 / 100 } }),
  45: (entry) => ({ formula: 'growth', args: { func: 'bigBase', x1: 2, x2: entry.x5 / 100 } }),
  58: (entry) => ({ formula: 'linear', args: { perLevel: entry.x5 } })
};
// UPKEEP: talents 483 and 599 cap and lower these two rows (ArcaneType.js:110-118, 228-234).
const CAPPED_BY = { 7: "The Tenteyecle talent's own chance" };
const LOWERED_BY = { 13: 'The Backup Energy talent, up to 10 more kills' };
// UPKEEP: Backup Energy's talent id, the talent LOWERED_BY names.
const BACKUP_ENERGY = 599;
// UPKEEP: hover help (N.js:118292), with its account readouts cut.
const NOTES = {
  0: 'Enter Arcanist Form to collect Tachyons from monsters! Defeat Arcane Monsters spawned by your Crystal Talent within the timer to unlock the next map. If you run out of time, arcane mobs will despawn and your crystal will lose its charge.',
  3: 'This chance goes down with each Prisma Bubble you get. Also, drop chance increases based on your current World.',
  5: 'Quality is a rough idea of how powerful a weapon is. Only the stats themselves matter. Every Weapon Power gives a 1.04x DMG multi stack. Mobs will only drop up to 100 Arcanist weapons a day.',
  10: 'You have to be in Arcanist Form, duh...',
  18: '2x Quantity just means that if a monster drops 3 statues, you\'ll get 6 instead! This also affects Statues dropped from AFK gains.',
  23: 'Quality is a rough idea of how powerful a ring is. Only the stats themselves matter. Mobs will only drop up to 100 Arcanist rings a day.',
  30: '2x Quantity just means that if a monster drops 17 golden food, you\'ll get 34 instead! This also affects Gold Food dropped from AFK gains.',
  49: '\'Upgrades\' here means Tesseract Upgrades, as you might have assumed...',
  51: 'For example, if your normal Drop Rate is 20x, and this upgrade is 25%, it would give you 5x Prisma drop chance!',
  54: 'Endless mode is accessed in the Top Right of the Summoner\'s Table',
  58: 'Higher than what, you ask? Well, higher than the amount shown in the Overwhelming Energy talent.'
};

const row = {
  kind: 'tesseractupgrade',
  section: 'tesseract',
  key: (entry, index) => `ArcaneUpg${index}`,
  icon: (entry, index) => `/data/ArcaneUpg${index}.png`,
  fallbackIcon: '/data/StatusArc0.png',
  // UPKEEP: unreleased rows are named Boundless_Energy ("These pages are missing...").
  skip: (entry) => (entry.name === 'Boundless_Energy' ? 'placeholder: missing page' : false),
  describe: (entry, index) => (index === PRISMA_ODDS ? entry.description.replace('$', PRISMA_BASE_ODDS) : entry.description),
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    cap: entry.x4 < UNCAPPED_FROM ? entry.x4 : null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.x5 } },
      { token: '}', formula: 'rounded', args: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x5 / 100 }, mode: 'floor', from: FLOOR_FROM } },
      ...(DOLLAR[index] ? [{ token: '$', ...DOLLAR[index](entry) }] : [])
    ]
  }),
  cost: (entry, index) => ({
    formula: 'notateBig',
    args: { formula: 'affinePowPlusLevel', args: { scale: COST_SCALE * Math.pow(COST_INDEX_RATE, index), base: entry.x1, rate: entry.x2 + COST_RATE_BUMP } },
    currency: `${TACHYONS[entry.x3]} Tachyons`,
    currencyOne: `${TACHYONS[entry.x3]} Tachyon`
  }),
  costs: (entry) => [{ item: `Tach${entry.x3}` }],
  fields: (entry, index, data) => [
    classField(CLASS),
    // UPKEEP: ArcaneUpgUNLOCKED counts the rows by x6 against the total; the panel's locked line is N.js:118290.
    unlocksAt(entry.x6, 'Tesseract'),
    NOT_FRACTAL.has(index) ? null : linked({ label: 'Boosted by', value: spaced(data.tesseract[FRACTAL].name) }, 'boostedBy', nodeId(row, null, FRACTAL)),
    CAPPED_BY[index] ? { label: 'Capped at', value: CAPPED_BY[index] } : null,
    LOWERED_BY[index] ? linked({ label: 'Lowered by', value: LOWERED_BY[index] }, 'boostedBy', `talent:${BACKUP_ENERGY}`) : null,
    NOTES[index] ? { label: 'Note', value: NOTES[index] } : null
  ].filter(Boolean)
};

export default row;
