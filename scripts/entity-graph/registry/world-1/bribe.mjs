// UPKEEP: the game prices a set gate that unlocks elsewhere (Garbage Tuna, Jade Emporium, the
// last "no more bribes" row) at this sentinel instead of a real cost; re-check it on a patch.
const NOT_FOR_SALE_PRICE = 99999999;

// A bribe is bought once from a bribe set; `npc` names the set, and the game draws that set's
// portrait (BribeO<set>) above it, which is the only art a bribe has.
export default {
  kind: 'bribe',
  section: 'bribes',
  // UPKEEP: keyed by table position; a bribe inserted mid-table renames every page after it.
  key: (entry, index) => `Bribe${index}`,
  icon: (entry) => `/data/BribeO${entry.npc}.png`,
  fallbackIcon: '/data/BribeW.png',
  // UPKEEP: only bribe 0 carries a stale number in its text (the app patches it the same way, bribes.jsx).
  describe: (entry, index) => (index === 0 ? entry.desc.replace('5%', `${entry.value}%`) : entry.desc),
  fields: (entry) => (entry.price === NOT_FOR_SALE_PRICE ? [] : [{ label: 'Price', value: entry.price, format: 'coins' }]),
  skip: (entry) => (/filler/i.test(entry?.name || '') ? 'filler row' : false)
};
