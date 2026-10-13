// A bribe is bought once from a bribe set; `npc` names the set, and the game draws that set's
// portrait (BribeO<set>) above it, which is the only art a bribe has.
export default {
  kind: 'bribe',
  section: 'bribes',
  // UPKEEP: keyed by table position; a bribe inserted mid-table renames every page after it.
  key: (entry, index) => `Bribe${index}`,
  icon: (entry) => `/data/BribeO${entry.npc}.png`,
  fallbackIcon: '/data/BribeW.png',
  describe: (entry) => entry.desc,
  fields: (entry) => [{ label: 'Price', value: entry.price, format: 'coins' }],
  skip: (entry) => (/filler/i.test(entry?.name || '') ? 'filler row' : false)
};
