import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout } from '../text.mjs';
import compassUpgrade from '../classes/compass-upgrade.mjs';

// The Atom Collider's upgrades (atomCollider.ts). A page has no save, so every cost discount reads
// as none. The calculator is uncapped: the real cap is 20 plus what the player has unlocked, so
// clamping at the base would stop players above it reading their numbers.
// UPKEEP: AtomCollider("AtomMaxLv") base 20, raised by the Isotope Discovery superbit (+10), the Atomic Potential compass upgrade (index 53) and the Higgs Boson event shop bonus (+20).
const BASE_MAX_LEVEL = 20;
// UPKEEP: the two raisers that have a page: the Isotope Discovery superbit (index 23) and the Atomic Potential compass upgrade (index 53). The Higgs Boson event shop bonus has no page.
const ISOTOPE_DISCOVERY = 23;
const ATOMIC_POTENTIAL = 53;

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
  fields: () => [
    linked(
      { label: 'Base max level', value: `${BASE_MAX_LEVEL} (raised by the Isotope Discovery superbit, the Atomic Potential compass upgrade and the Higgs Boson event shop bonus)` },
      'maxRaisedBy',
      `superbit:Superbit${ISOTOPE_DISCOVERY}`,
      nodeId(compassUpgrade, null, ATOMIC_POTENTIAL)
    )
  ],
  cost: (entry) => ({
    formula: 'affinePowFloor',
    args: { base: entry.x3, perLevel: entry.x1, rate: entry.x2 },
    currency: 'Particles'
  })
};
