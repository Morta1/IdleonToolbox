import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout } from '../text.mjs';
import compassUpgrade from '../classes/compass-upgrade.mjs';

// The Atom Collider's upgrades (atomCollider.ts). A page has no save, so every cost discount reads
// as none. The calculator is uncapped: the real cap is 20 plus what the player has unlocked, so
// clamping at the base would stop players above it reading their numbers.

// The base max level and the two raisers that have a page: the atomMaxLevel table, AtomCollider("AtomMaxLv")'s base
// and its Isotope Discovery superbit and Atomic Potential compass upgrade arguments. The Higgs Boson event shop bonus
// has no page. No table, no field.
const maxLevelField = (data) => {
  const max = gameTable(data, 'atomMaxLevel');
  return max
    ? linked(
      { label: 'Base max level', value: `${max.base} (raised by the Isotope Discovery superbit, the Atomic Potential compass upgrade and the Higgs Boson event shop bonus)` },
      'maxRaisedBy',
      `superbit:Superbit${max.isotopeDiscovery}`,
      nodeId(compassUpgrade, null, max.atomicPotential)
    )
    : null;
};

export default {
  kind: 'atom',
  section: 'atomsInfo',
  // UPKEEP: keyed by table position, and the art (Atom<i>) follows it.
  key: (entry, index) => `Atom${index}`,
  icon: (entry, index) => `/data/Atom${index}.png`,
  fallbackIcon: '/data/ConTower8.png',
  // Carbon and Fluoride end on a "Total bonus" readout of the player's own bonus.
  describe: (entry) => dropReadout(entry.desc),
  effect: (entry) => ({
    levelLabel: 'Atom level',
    cap: null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.baseBonus } },
      // UPKEEP: `<` is the bare level (only Oxygen's minimum talent level uses it).
      { token: '<', formula: 'linear', args: { perLevel: 1 } }
    ]
  }),
  fields: (entry, index, data) => [maxLevelField(data)].filter(Boolean),
  cost: (entry) => ({
    formula: 'affinePowFloor',
    args: { base: entry.x3, perLevel: entry.x1, rate: entry.x2 },
    currency: 'Particles',
    // A font glyph in the game; the site's own particle art, as the dashboard shows it.
    currencyIcon: '/etc/Particle.png'
  })
};
