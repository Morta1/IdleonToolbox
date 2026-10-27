// Named indices into the account options list (save key `OptLacc`, the game's
// `OptionsListAccount`), parsed onto `account.accountOptions`. Name an index only from evidence:
// the game code that reads it, or what an existing parser already uses it for. Indices whose
// meaning is unclear stay numeric; `node tools/opt-inventory.mjs` lists them.
export const OPT = {
  highestArenaWave: 89,
  dailyCrystalKills: 101,
  killroyDone: 113,
  alternateParticles: 135,
  gildedStamps: 154,
  islandTrash: 161,
  weeklyBossTurn: 185,
  weeklyBossBestSkulls: 189,
  selectedNinjaMastery: 231,
  ninjaMasteryTier: 232,
  owlFeathers: 253,
  owlMegaFeathers: 262,
  kangarooFish: 267,
  kangarooMegaFish: 279,
  summoningHighestEndless: 319,
  grimoireBonesCollected: 329,
  vaultOresMined: 340,
  vaultFishCaught: 345,
  vaultBugsCaught: 346,
  topOfTheMorninKillsLeft: 365,
  prismaFound: 395,
  arcanistWeaponDropsToday: 396,
  arcanistRingDropsToday: 397,
  masterclassDiscountsUsedToday: 480,
} as const;
