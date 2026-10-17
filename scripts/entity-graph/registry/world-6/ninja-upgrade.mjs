import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';

// The jadeUpgradeCost table, JadeUpgCost (Ninja.js:187): rows past specialAbove unlock one at a time with Coral Reef
// upgrade 3 ("Adds a new mini 'Ninja Knowledge' upgrade", N.js:109130) and cost specialBase^floor(specialScale (t -
// specialOffset)) x more, except fixedRow (2.3.540's Omnijade row), a flat fixedBase^fixedExponent x more; the Centurion
// row costs centurionBase^centurionExponent x more. No table, no price.
const firstSpecial = (data) => {
  const cost = gameTable(data, 'jadeUpgradeCost');
  return cost ? cost.specialAbove + 1 : null;
};
const specialPrefactor = (t, cost) => (t === cost.fixedRow
  ? Math.pow(cost.fixedBase, cost.fixedExponent)
  : Math.pow(cost.specialBase, Math.floor(cost.specialScale * (t - cost.specialOffset))));
const prefactor = (t, cost) => (t > cost.specialAbove
  ? specialPrefactor(t, cost)
  : t === cost.centurionRow ? Math.pow(cost.centurionBase, cost.centurionExponent) : 1);
// UPKEEP: the root upgrade, drawn with no prerequisite (N.js:109130). Not extracted: the Way of Stealth root is found
// only by draw state.
const WAY_OF_STEALTH = 13;

// UPKEEP: the Coral Reef station node (nodes/stations.mjs).
const CORAL_REEF = 'station:coralreef';

// The unlock line and the page it names: the Coral Reef station, or the prerequisite upgrade by index. The
// ninjaMasteryGates table: changemonsterDEF (N.js:80489) rewrites a row's prerequisite once Ninja Mastery reaches the
// tier. With no jadeUpgradeCost table the Coral Reef rows cannot be told apart, and with no ninjaMasteryGates table the
// gated rows cannot, so the rows that could be either get no line.
const unlockOf = (entry, index, data) => {
  const name = (t) => spaced(data.ninjaUpgrades?.[t]?.name);
  const first = firstSpecial(data);
  if (first !== null && index >= first) {
    return { value: `Coral Reef: level ${index - first + 1} of the upgrade that adds mini Ninja Knowledge upgrades`, link: CORAL_REEF };
  }
  const gates = gameTable(data, 'ninjaMasteryGates');
  const gate = gates?.[index];
  if (gate) {
    return { value: `Ninja Mastery ${gate.mastery}, then ${name(gate.prerequisite)} at level 1`, link: nodeId(row, null, gate.prerequisite) };
  }
  if (first === null || !gates) return { value: null };
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
  cost: (entry, index, data) => {
    const cost = gameTable(data, 'jadeUpgradeCost');
    return cost ? { formula: 'notateBig', args: { formula: 'pow', args: { base: prefactor(index, cost) * entry.x7, rate: entry.x8 } }, currency: 'Jade Coins' } : null;
  },
  fields: (entry, index, data) => {
    const { value, link } = unlockOf(entry, index, data);
    return value ? [linked({ label: 'Unlocked by', value }, 'unlockedBy', link)] : [];
  }
};

export default row;
