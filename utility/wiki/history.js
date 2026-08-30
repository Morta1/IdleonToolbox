// Turning a diff into a sentence. The extractor emits the game's own field names, which is the
// right boundary: it produces data, the site produces words.
import { cleanUnderscore, notateNumber } from '@utility/helpers';

// The archive starts here, so "no changes listed" means "none since 2.3.43" and must not be read
// as "this has never changed".
export const ARCHIVE_START = '2.3.43';

// Diffed from our own per-version data exports, which move when the extractor changes as well as
// when the game does. Two statistical filters and a curated field list remove almost all of that,
// but an extraction bugfix is indistinguishable from a nerf, so the page says so rather than
// presenting every line as certain. "the versions we have data for" is the honest phrasing: the
// archive skips versions (2.3.496, 2.3.512-521 and others), so a change that shipped in a missing
// one is attributed to the next version we hold.
// Lives here rather than in either surface: the entity page and the rollup page show the same
// caveat, and two copies of it drift.
export const CAVEAT = `Derived by comparing the game's data between the versions we have data for, `
  + `starting at ${ARCHIVE_START}. `
  + 'An occasional line may be a correction to how the data is read rather than a change to the game.';

// Only the fields a reader would not decode. Anything absent falls through to title case.
export const FIELD_LABELS = {
  UQ1txt: 'Bonus',
  UQ1val: 'Bonus value',
  UQ2txt: 'Second bonus',
  UQ2val: 'Second bonus value',
  MonsterHPTotal: 'Health',
  ExpGiven: 'EXP',
  RespawnTime: 'Respawn time',
  MoveSPEED: 'Move speed',
  materials: 'Recipe',
  desc_line1: 'Description',
  desc: 'Description',
  displayName: 'Name',
  lvReqToEquip: 'Level to equip',
  lvReqToCraft: 'Level to craft',
  Weapon_Power: 'Weapon power',
  Upgrade_Slots_Left: 'Upgrade slots',
  tourPower: 'Tournament power',
  upgradedTourPower: 'Upgraded tournament power',
  upgradedEffect: 'Upgraded effect',
  upgradedBonus: 'Upgraded bonus',
  perTier: 'Per tier',
  SpecialType: 'Special type',
  subType: 'Type',
  // A talent change is reported as the part of the talent that moved, so these are the labels a
  // talent row is read by. `description` is the sentence the talent page shows under "Effect", and
  // repeating that word here points the reader at the box directly above the change.
  description: 'Effect',
  // The per-level line the game prints under a talent. "Lvl Up Text" is the raw key wearing a hat.
  lvlUpText: 'Per level bonus',
  // x and y are the talent's two bonuses: `{` in the description takes the x value and `}` the y
  // (see TalentInfo.jsx). Each is a pair of curve parameters, the first the value and the second
  // how it scales with level, and the pair follows the "Bonus"/"Second bonus" convention UQ1 and
  // UQ2 already set above. x1 was already here for vials, where it means the same thing.
  x1: 'Value',
  x2: 'Value scaling',
  y1: 'Second value',
  y2: 'Second value scaling'
};

export const fieldLabel = (field) => {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const words = String(field || '')
    // A plain camelCase field (sellPrice, itemQuantity) has no underscore to split on, so without
    // this it arrives as one lowercase "word" and the map below never gets a chance to fix it.
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\s]+/)
    .filter(Boolean);
  // Only the first word is forced to a capital. Every other word already starts uppercase on its
  // own, whether split out of SCREAMING_SNAKE_CASE or off a camelCase boundary, so touching it
  // here would just be redundant. A lone lowercase word with no boundary to split on ("effect",
  // "bonus", "name": 49 rows between them) needs the same capital, or it reads as lowercase
  // against the page's Title Case headings. STR and its three siblings are unaffected: their
  // first letter is already a capital, so they keep rendering as Str, Agi, Wis and Luk.
  return words
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() : word.charAt(0)) + word.slice(1).toLowerCase())
    .join(' ');
};

// Past a billion the digit string stops being a number a reader can take in: monster:w7b8's
// health goes 3e+31 to 5e+33, which toLocaleString renders as a 40 character comma string on
// every World 7 boss page. notateNumber is what the rest of the site uses, but its unsuffixed
// branch floors anything under 100 (0.2 would print as "0") and rounds 4,200 to "4.2K", so exact
// digits stay below the threshold where they are still readable.
const NOTATE_ABOVE = 1e9;
const formatNumber = (value) => (value >= NOTATE_ABOVE ? notateNumber(value) : value.toLocaleString('en-US'));

export const formatValue = (value) => {
  if (value == null) return 'none';
  // The game writes "no bonus here" as a literal 0, and a bare 0 beside an arrow reads as a real
  // number rather than as an absence.
  if (value === 0 || value === '0') return 'none';
  if (Array.isArray(value)) {
    // A recipe: the only array shape in the history.
    if (value.every((entry) => entry?.itemName)) {
      return value.map((entry) => `${cleanUnderscore(entry.itemName)} x${entry.itemQuantity}`).join(', ');
    }
    return value.map((entry) => formatValue(entry)).join(', ');
  }
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'object') return JSON.stringify(value);
  // A description or effect string can carry the game's own template slots for bonuses that live
  // in separate fields, ones that may themselves be changing in this same event. Elsewhere
  // (StampInfo.jsx, TalentInfo.jsx, CardBonus.jsx) a slot is filled with the paired value because
  // the page is showing a live stat; here it is a changelog line comparing two strings, so filling
  // it would invent a pairing the diff does not actually have. Drop the slots instead.
  //
  // Both braces, not only the opening one: "{" takes the first value and "}" the second, and a
  // talent that has two bonuses uses both. Dropping only "{" left a stray "}" mid-sentence on
  // every such row.
  return cleanUnderscore(String(value))
    .replace(/[{}]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};
