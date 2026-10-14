// A trait's global index is its tier's offset plus its slot: the art is numbered across the tiers.
const firstOf = (data, index) => data.dungeonTraits.slice(0, index).reduce((sum, tier) => sum + tier.bonuses.length, 0);

export default {
  kind: 'dungeontrait',
  section: 'dungeonTraits',
  key: (entry, index) => `DungTraitTier${index}`,
  // UPKEEP: the tier names are hand-typed in the extractor (z-processing/features/dungeons.js:70-71), transcribed from the DungStatTr0-8 banner art; the game has no text string for them, so "ChOiIiCe Traits" is the extractor's casing of the banner's mixed letters, and a new tier needs its name re-checked against its banner.
  name: (entry) => entry.section,
  icon: (entry, index, data) => `/data/DungTraitA${firstOf(data, index)}.png`,
  // DungUpg[2] holds one trait id per tier (N.js:94862).
  describe: (entry) => `Dungeon Rank ${entry.levelReq} traits: one of them can be active at a time.`,
  // The data's levelReq equals TraitLvReq (N.js:87595).
  fields: (entry) => [{ label: 'Unlocks at', value: `Dungeon Rank ${entry.levelReq}` }],
  entriesLabel: 'Traits',
  entries: (entry, index, data) => entry.bonuses.map((trait, k) => ({
    key: `DungTrait${firstOf(data, index) + k}`,
    icon: `/data/DungTraitA${firstOf(data, index) + k}.png`,
    // UPKEEP: the game writes "/" as `~` in "armor_~_jewelry", and `~` is a sweep token.
    description: trait.replace(/~/g, '/')
  }))
};
