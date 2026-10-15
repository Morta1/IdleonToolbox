import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';

const CENTURION = 0;
// UPKEEP: rows 17 and up unlock one at a time with Coral Reef upgrade 3 ("Adds a new mini 'Ninja Knowledge' upgrade", N.js:109130); 17 is also where the cost steepens (16 < t).
const FIRST_SPECIAL = 17;
// UPKEEP: JadeUpgCost (Ninja.js:187): Centurion Lineage costs 1e45 x more, every row past 16 costs 10^floor(2 (t - 15)) x more.
const prefactor = (t) => (t >= FIRST_SPECIAL ? Math.pow(10, Math.floor(2 * (t - 15))) : t === CENTURION ? 1e45 : 1);
// UPKEEP: the root upgrade, drawn with no prerequisite (N.js:109130).
const WAY_OF_STEALTH = 13;
// UPKEEP: N.js:80489 rewrites these prerequisites once Ninja Mastery reaches the tier: row -> [mastery, prerequisite row].
const MASTERY_GATES = { 6: [1, 10], 3: [1, 5], 1: [3, 4], 0: [5, 1] };

// UPKEEP: the Coral Reef station node (nodes/stations.mjs).
const CORAL_REEF = 'station:coralreef';

// The unlock line and the page it names: the Coral Reef station, or the prerequisite upgrade by index.
const unlockOf = (entry, index, data) => {
  const name = (t) => spaced(data.ninjaUpgrades?.[t]?.name);
  if (index >= FIRST_SPECIAL) {
    return { value: `Coral Reef: level ${index - FIRST_SPECIAL + 1} of the upgrade that adds mini Ninja Knowledge upgrades`, link: CORAL_REEF };
  }
  if (MASTERY_GATES[index]) {
    const [mastery, required] = MASTERY_GATES[index];
    return { value: `Ninja Mastery ${mastery}, then ${name(required)} at level 1`, link: nodeId(row, null, required) };
  }
  return index === WAY_OF_STEALTH ? { value: null } : { value: `${name(entry.x9)} at level 1`, link: nodeId(row, null, entry.x9) };
};

const row = {
  kind: 'ninjaupgrade',
  section: 'ninjaUpgrades',
  key: (entry, index) => `NinjaUpg${index}`,
  icon: (entry, index) => `/data/NjUpgI${index}.png`,
  fallbackIcon: '/data/NjUpgI13.png',
  // UPKEEP: the game's spare slot is named 'Name'.
  skip: (entry) => (entry.name === 'Name' ? 'placeholder: no upgrade yet' : false),
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.modifier } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.modifier / 100 } }
    ]
  }),
  // The panel prints JadeUpgCost through NotateNumber(x, "Big") (N.js:109131), which floors below 1,000 (notateBig reads
  // wikiTables.notateNumber).
  cost: (entry, index) => ({ formula: 'notateBig', args: { formula: 'pow', args: { base: prefactor(index) * entry.x7, rate: entry.x8 } }, currency: 'Jade Coins' }),
  fields: (entry, index, data) => {
    const { value, link } = unlockOf(entry, index, data);
    return value ? [linked({ label: 'Unlocked by', value }, 'unlockedBy', link)] : [];
  }
};

export default row;
