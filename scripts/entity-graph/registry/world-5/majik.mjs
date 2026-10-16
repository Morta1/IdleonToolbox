import { gameTable, listAt } from '../data.mjs';
import { dropReadout } from '../text.mjs';

// UPKEEP: three majik trees in CosmoUpgrades; the Conjuror tab calls them Hole, Village and IdleOn majik. Not extracted:
// the tab labels are drawn as art, never written as text.
const TREES = ['Hole', 'Village', 'IdleOn'];
// The cosmoForge table (Holes CosmoBonusQTY): the forge majik is rate^L; every other is floor(x0 * L). Without it the
// forge cannot be told apart, so no majik is filled.
const termsOf = (entry, data) => {
  const forge = gameTable(data, 'cosmoForge');
  if (!forge) return [];
  if (entry.tree === forge.tree && entry.slot === forge.slot) return [{ token: '{', formula: 'pow', args: { base: 1, rate: forge.rate } }];
  return [
    { token: '{', formula: 'linear', args: { perLevel: entry.x0 } },
    { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x0 / 100 } }
  ];
};

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
  effect: (entry, index, data) => {
    // EnhanceMaxLV reads the list block listIndexes.majikMaxLevels starts, one list per tree (Holes:EnhanceMaxLV); the first
    // level is the purchase, the rest are enhancements.
    const maxLevels = listAt(data.holesInfo, data, 'majikMaxLevels', entry.tree);
    return { levelLabel: 'Majik level', cap: maxLevels ? Number(maxLevels[entry.slot]) + 1 : null, terms: termsOf(entry, data) };
  },
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Majik Points', currencyOne: 'Majik Point', note: 'One point per level.' }),
  fields: (entry) => [{ label: 'Tree', value: `${TREES[entry.tree]} majik` }]
};
