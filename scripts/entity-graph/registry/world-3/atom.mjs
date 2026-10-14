import { dropReadout } from '../text.mjs';

// The Atom Collider's upgrades (atomCollider.ts). A page has no save, so every cost discount reads
// as none and the cap is the base one.
// UPKEEP: AtomCollider("AtomMaxLv") base 20, before the Isotope Discovery superbit, compass 53 and event shop 28.
const BASE_MAX_LEVEL = 20;

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
    cap: BASE_MAX_LEVEL,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.baseBonus } },
      // UPKEEP: `<` is the bare level (only Oxygen's minimum talent level uses it).
      { token: '<', formula: 'linear', args: { perLevel: 1 } }
    ]
  }),
  cost: (entry) => ({
    formula: 'affinePowFloor',
    args: { base: entry.x3, perLevel: entry.x1, rate: entry.x2 },
    currency: 'Particles'
  })
};
