import { dropReadout } from '../text.mjs';

// UPKEEP: three majik trees in CosmoUpgrades; the Conjuror tab calls them Hole, Village and IdleOn majik.
const TREES = ['Hole', 'Village', 'IdleOn'];
// UPKEEP: CosmoBonusQTY (Holes.js:259): IdleOn majik 1 (Beeg Beeg Forge) is 3^L; every other is floor(x0 * L).
const isForge = ({ tree, slot }) => tree === 2 && slot === 1;

export default {
  kind: 'majik',
  // Flattened, so every hook knows its tree and slot.
  section: (data) => (data.cosmoUpgrades || []).flatMap((tree, t) => tree.map((upgrade, i) => ({ ...upgrade, tree: t, slot: i }))),
  key: (entry) => `Majik${entry.tree}_${entry.slot}`,
  // UPKEEP: HoleUIcosmoUpg<A|B|C><0|1> is the tree's hex frame (0 empty, 1 filled); no per-majik art ships, so a tree shares one icon.
  icon: (entry) => `/data/HoleUIcosmoUpg${'ABC'[entry.tree]}1.png`,
  fallbackIcon: '/etc/Villager_2.png',
  // UPKEEP: the game's filler slots.
  skip: (entry) => (entry.name === 'Confused_Bonus' ? 'placeholder: no bonus yet' : false),
  describe: (entry) => (entry.name === 'Pocket_Divinity'
    // UPKEEP: Y and Z are the gods the player linked (Holes.js:34-35); one link per level.
    ? 'Get_the_link_bonuses_of_a_god_you_pick,_one_god_per_level.'
    : dropReadout(entry.description)),
  effect: (entry, index, data) => ({
    levelLabel: 'Majik level',
    // UPKEEP: EnhanceMaxLV is HolesInfo[56 + tree][slot]; the first level is the purchase, the rest are enhancements.
    cap: Number(data.holesInfo?.[56 + entry.tree]?.[entry.slot]) + 1,
    terms: isForge(entry)
      ? [{ token: '{', formula: 'pow', args: { base: 1, rate: 3 } }]
      : [
        { token: '{', formula: 'linear', args: { perLevel: entry.x0 } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x0 / 100 } }
      ]
  }),
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Majik Points', currencyOne: 'Majik Point', note: 'One point per level.' }),
  fields: (entry) => [{ label: 'Tree', value: `${TREES[entry.tree]} majik` }]
};
