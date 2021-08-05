const baseEffects = {
  BaseAllStats: "All Stats",
  BaseDamage: "Base Damage",
  BaseDefense: "Base Defense",
  BaseAccuracy: "Base Accuracy",
  BaseSTR: "Base STR",
  BaseAGI: "Base AGI",
  BaseWIS: "Base WIS",
  BaseLUK: "Base LUK",
  BaseHP: "Base HP",
  BaseMP: "Base MP",
  MoveSpeed: "Move Speed",
  WeaponPower: "Weapon Power",
  MinimumDamage: "Minimum Damage",
};

const MultiplierEffects = {
  FightingAfk: "% Fighting AFK Gain Rate",
  DoubleAfkChance: "% Double AFK Claim Chance",
  CritChance: "% Crit Chance",
  CritDamage: "% Crit Damage",
  TotalDamage: "% Total Damage",
  TotalHP: "% Total HP",
  TotalMP: "% Total MP",
  TotalDefense: "% Defense",
  TotalAccuracy: "% Total Accuracy",
  MPRegen: "% MP Regen Rate",
  EquipmentDefense: "% Defense from Equipment",
  CardChance: "% Card Drop Chance",
  CrystalChance: "% Crystal Mob Spawn Chance",
  FoodEffect: "% Food Effect",
  BoostFoodEffect: "% Boost Food Effect",
  NoFoodConsume: "% To not consume Food",
  DropRate: "% Total Drop Rate",
};

const ClassAndMonsterEffects = {
  ClassExp: "% Class Exp",
  ExpConversion: "% EXP Conversion (Talent)",
  MonsterExpActive: "% Monster EXP (Active)",
  MonsterExp: "% Monster EXP",
  MonsterMoney: "% Money from Monsters",
  BossDamage: "% Boss Damage",
  MobRespawn: "% Mob Respawn Rate",
};

const SkillEffect = {
  SkillAfk: "% Skill AFK Gain Rate",
  SkillExp: "% Skill EXP",
  SkillProwess: "% Skill Prowess",
  SmithingEfficiency: "% Total Smithing Efficiency",
  SmithingExp: "% Smithing EXP",
  MiningAfk: "% Mining Away Gains",
  MiningBase: "Base Mining Power",
  MiningEfficiency: "% Total Mining Efficiency",
  MiningExp: "% Mining EXP",
  MiningMultiOre: "% Multi-Ore Chance",
  MiningPower: "% Mining Power",
  MiningSpeed: "% Mining Speed",
  ChoppinAfk: "% Choppin Away Gains",
  ChoppinBase: "Base Choppin Power",
  ChoppinEfficiency: "% Total Choppin Efficiency",
  ChoppinExp: "% Choppin EXP",
  ChoppinMultiLog: "% Multi-Log Chance",
  ChoppinPower: "% Choppin Power",
  ChoppinSpeed: "% Choppin Speed",
  FishingAfk: "% Fishing Away Gains",
  FishingBase: "Base Fishing Power",
  FishingEfficiency: "% Total Fishing Efficiency",
  FishingExp: "% Fishing EXP",
  FishingMultiFish: "% Multi-Fish Chance",
  FishingPower: "% Fishing Power",
  WorshipCharge: "% Worship Max Charge",
  WorshipChargeRate: "% Worship Charge Rate",
  WorshipBase: "Base Worship Power",
  WorshipPoints: "Starting Points in Worship",
  TrappingShiny: "% Shiny Critter Chance",
  TrappingEfficiency: "% Trapping Efficiency",
  TrappingExp: "% Trapping EXP",
  TrappingBase: "Base Trapping Power",
  // FishingSpeed: "% Fishing Speed",
  CatchingAfk: "% Catching Away Gains",
  CatchingBase: "Base Catching Power",
  CatchingEfficiency: "% Total Catching Efficiency",
  CatchingExp: "% Catching EXP",
  CatchingMultiCatch: "% Multi-Catch Chance",
  CatchingPower: "% Catching Power",
};

const PassiveEffects = {
  ProductionSpeed: "% Total Production Speed",
  TownSkillSpeed: "% Speed in Town Skills",
  AlchemyExp: "% Alchemy EXP",
  CogSpeed: "% Cog Build Spd (Passive)",
  ConstructionExp: "% Construction Exp",
  ShrineEffect: "% Shrine Effects",
};

const effects = {
  ...baseEffects,
  ...MultiplierEffects,
  ...ClassAndMonsterEffects,
  ...SkillEffect,
  ...PassiveEffects,
};

const cardCategory = {
  BlunderHills: "Blunder Hills",
  YumYumDesert: "Yum Yum Desert",
  EasyResources: "Easy Resources",
  MediumResources: "Medium Resources",
  HardResources: "Hard Resources",
  FrostbiteTundra: "Frostbite Tundra",
  Bosses: "Bosses",
  Events: "Events",
};

export const cardsObject = {
  BlunderHills: [
    {
      img: "Green_Mushroom_Card.png",
      effect: effects.BaseHP,
      category: cardCategory.BlunderHills,
      stats: [12, 24, 36, 48],
    },
    {
      img: "Red_Mushroom_Card.png",
      effect: effects.BaseLUK,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Frog_Card.png",
      effect: effects.TrappingShiny,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Bored_Bean_Card.png",
      effect: effects.BaseDamage,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Slime_Card.png",
      effect: effects.BaseWIS,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Baby_Boa_Card.png",
      effect: effects.MoveSpeed,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Carrotman_Card.png",
      effect: effects.BaseAGI,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Glublin_Card.png",
      effect: effects.TotalHP,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Wode_Board_Card.png",
      effect: effects.BaseSTR,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Gigafrog_Card.png",
      effect: effects.CardChance,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Poop_Card.png",
      effect: effects.CrystalChance,
      category: cardCategory.BlunderHills,
    },

    {
      img: "Rat_Card.png",
      effect: effects.CritChance,
      category: cardCategory.BlunderHills,
    },

    {
      img: "Walking_Stick_Card.png",
      effect: effects.BaseWIS,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Nutto_Card.png",
      effect: effects.MonsterMoney,
      category: cardCategory.BlunderHills,
    },

    {
      img: "Crystal_Carrot_Card.png",
      effect: effects.DropRate,
      category: cardCategory.BlunderHills,
    },
    {
      img: "Wood_Mushroom_Card.png",
      effect: effects.TotalAccuracy,
      category: cardCategory.BlunderHills,
    },
  ],
  YumYumDesert: [
    {
      img: "Bandit_Bob_Card.png",
      effect: effects.MonsterMoney,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Crabcake_Card.png",
      effect: effects.NoFoodConsume,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Crystal_Crabal_Card.png",
      effect: effects.MonsterExp,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Dig_Doug_Card.png",
      effect: effects.BaseLUK,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Mafioso_Card.png",
      effect: effects.BaseAGI,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Mashed_Potato_Card.png",
      effect: effects.CritDamage,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Mimic_Card.png",
      effect: effects.DropRate,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Moonmoon_Card.png",
      effect: effects.MonsterExpActive,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Pincermin_Card.png",
      effect: effects.WeaponPower,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Sandy_Pot_Card.png",
      effect: effects.ExpConversion,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Sand_Castle_Card.png",
      effect: effects.TotalAccuracy,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Sand_Giant_Card.png",
      effect: effects.MinimumDamage,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Snelbie_Card.png",
      effect: effects.CardChance,
      category: cardCategory.YumYumDesert,
    },
    {
      img: "Tyson_Card.png",
      effect: effects.BaseSTR,
      category: cardCategory.YumYumDesert,
    },
  ],
  EasyResources: [
    {
      img: "Bleach_Logs_Card.png",
      effect: effects.ChoppinEfficiency,
      category: cardCategory.EasyResources,
    },
    {
      img: "Butterfly_Card.png",
      effect: effects.CatchingEfficiency,
      category: cardCategory.EasyResources,
    },
    {
      img: "Copper_Ore_Card.png",
      effect: effects.BaseAccuracy,
      category: cardCategory.EasyResources,
    },
    {
      img: "Fire_Forge_Card.png",
      effect: effects.SmithingExp,
      category: cardCategory.EasyResources,
    },
    {
      img: "Fly_Card.png",
      effect: effects.MonsterExpActive,
      category: cardCategory.EasyResources,
    },
    {
      img: "Forest_Fibres_Card.png",
      effect: effects.ExpConversion,
      category: cardCategory.EasyResources,
    },
    {
      img: "Goldfish_Card.png",
      effect: effects.TotalMP,
      category: cardCategory.EasyResources,
    },
    {
      img: "Gold_Ore_Card.png",
      effect: effects.MiningExp,
      category: cardCategory.EasyResources,
    },
    {
      img: "Hermit_Can_Card.png",
      effect: effects.FishingEfficiency,
      category: cardCategory.EasyResources,
    },
    {
      img: "Iron_Ore_Card.png",
      effect: effects.MiningEfficiency,
      category: cardCategory.EasyResources,
    },
    {
      img: "Jellyfish_Card.png",
      effect: effects.FishingExp,
      category: cardCategory.EasyResources,
    },
    {
      img: "Jungle_Logs_Card.png",
      effect: effects.ChoppinExp,
      category: cardCategory.EasyResources,
    },
    {
      img: "Oak_Logs_Card.png",
      effect: effects.BaseDefense,
      category: cardCategory.EasyResources,
    },
  ],
  MediumResources: [
    {
      img: "Bloach_Card.png",
      effect: effects.FishingAfk,
      category: cardCategory.MediumResources,
    },
    {
      img: "Cinder_Forge_Card.png",
      effect: effects.SmithingExp,
      category: cardCategory.MediumResources,
    },
    {
      img: "Crabbo_Card.png",
      effect: effects.TrappingEfficiency,
      category: cardCategory.MediumResources,
    },
    {
      img: "Dementia_Ore_Card.png",
      effect: effects.MiningSpeed,
      category: cardCategory.MediumResources,
    },
    {
      img: "Dune_Soul_Card.png",
      effect: effects.WorshipPoints,
      category: cardCategory.MediumResources,
    },
    {
      img: "Forest_Soul_Card.png",
      effect: effects.EquipmentDefense,
      category: cardCategory.MediumResources,
    },
    {
      img: "Froge_Card.png",
      effect: effects.BaseMP,
      category: cardCategory.MediumResources,
    },
    {
      img: "Fruitfly_Card.png",
      effect: effects.CatchingAfk,
      category: cardCategory.MediumResources,
    },
    {
      img: "Platinum_Ore_Card.png",
      effect: effects.MiningAfk,
      category: cardCategory.MediumResources,
    },
    {
      img: "Potty_Rolls_Card.png",
      effect: effects.ChoppinSpeed,
      category: cardCategory.MediumResources,
    },
    {
      img: "Scorpie_Card.png",
      effect: effects.TrappingExp,
      category: cardCategory.MediumResources,
    },
    {
      img: "Sentient_Cereal_Card.png",
      effect: effects.CatchingExp,
      category: cardCategory.MediumResources,
    },
    {
      img: "Tropilogs_Card.png",
      effect: effects.ChoppinAfk,
      category: cardCategory.MediumResources,
    },
    {
      img: "Veiny_Logs_Card.png",
      effect: effects.TotalAccuracy,
      category: cardCategory.MediumResources,
    },
    {
      img: "Void_Ore_Card.png",
      effect: effects.CardChance,
      category: cardCategory.MediumResources,
    },
  ],
  FrostbiteTundra: [
    {
      img: "Bloodbone_Card.png",
      effect: effects.TotalDamage,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Bloque_Card.png",
      effect: effects.BaseAGI,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Bop_Box_Card.png",
      effect: effects.DropRate,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Cryosnake_Card.png",
      effect: effects.MPRegen,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Crystal_Cattle_Card.png",
      effect: effects.MonsterExp,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Dedotated_Ram_Card.png",
      effect: effects.WeaponPower,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Frost_Flake_Card.png",
      effect: effects.BaseSTR,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Mamooth_Card.png",
      effect: effects.TotalHp,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Neyeptune_Card.png",
      effect: effects.TotalAccuracy,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Penguin_Card.png",
      effect: effects.BaseWIS,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Quenchie_Card.png",
      effect: effects.BaseLUK,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Sheepie_Card.png",
      effect: effects.EquipmentDefense,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Sir_Stache_Card.png",
      effect: effects.CardChance,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Snowman_Card.png",
      effect: effects.TotalDamage,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Thermister_Card.png",
      effect: effects.CritDamage,
      category: cardCategory.FrostbiteTundra,
    },
    {
      img: "Xylobone_Card.png",
      effect: effects.CritChance,
      category: cardCategory.FrostbiteTundra,
    },
  ],
  HardResources: [
    {
      img: "Bunny_Card.png",
      effect: effects.SkillAfk,
      category: cardCategory.HardResources,
    },
    {
      img: "Flycicle_Card.png",
      effect: effects.CatchingAfk,
      category: cardCategory.HardResources,
    },
    {
      img: "Frigid_Soul_Card.png",
      effect: effects.WorshipCharge,
      category: cardCategory.HardResources,
    },
    {
      img: "Lustre_Ore_Card.png",
      effect: effects.BaseLUK,
      category: cardCategory.HardResources,
    },
    {
      img: "Mosquisnow_Card.png",
      effect: effects.CatchingEfficiency,
      category: cardCategory.HardResources,
    },
    {
      img: "Mousey_Card.png",
      effect: effects.TrappingShiny,
      category: cardCategory.HardResources,
    },
    {
      img: "Owlio_Card.png",
      effect: effects.MonsterExp,
      category: cardCategory.HardResources,
    },
    {
      img: "Pingy_Card.png",
      effect: effects.TrappingShiny,
      category: cardCategory.HardResources,
    },
    {
      img: "Rooted_Soul_Card.png",
      effect: effects.WorshipPoints,
      category: cardCategory.HardResources,
    },
    {
      img: "Squiddy_Soul_Card.png",
      effect: effects.WorshipChargeRate,
      category: cardCategory.HardResources,
    },
    {
      img: "Tundra_Logs_Card.png",
      effect: effects.ChoppinAfk,
      category: cardCategory.HardResources,
    },
    {
      img: "Wispy_Lumber_Card.png",
      effect: effects.ChoppinSpeed,
      category: cardCategory.HardResources,
    },
  ],
  Bosses: [
    {
      img: "Baba_Yaga_Card.png",
      effect: effects.MonsterMoney,
      category: cardCategory.Bosses,
    },
    {
      img: "Biggie_Hours_Card.png",
      effect: effects.DoubleAfkChance,
      category: cardCategory.Bosses,
    },
    {
      img: "Boop_Card.png",
      effect: effects.FightingAfk,
      category: cardCategory.Bosses,
    },
    {
      img: "Chaotic_Amarok_Card.png",
      effect: effects.FightingAfk,
      category: cardCategory.Bosses,
    },
    {
      img: "Chaotic_Chizoar_Card.png",
      effect: effects.ShrineEffect,
      category: cardCategory.Bosses,
    },
    {
      img: "Chaotic_Efaunt_Card.png",
      effect: effects.SkillExp,
      category: cardCategory.Bosses,
    },
    {
      img: "Chizoar_Card.png",
      effect: effects.CogSpeed,
      category: cardCategory.Bosses,
    },
    {
      img: "Dr._Defecaus_Card.png",
      effect: effects.TotalDamage,
      category: cardCategory.Bosses,
    },
    {
      img: "King_Doot_Card.png",
      effect: effects.DropRate,
      category: cardCategory.Bosses,
    },
    {
      img: "Normal_Amarok_Card.png",
      effect: effects.SkillAfk,
      category: cardCategory.Bosses,
    },
    {
      img: "Normal_Efaunt_Card.png",
      effect: effects.MonsterExp,
      category: cardCategory.Bosses,
    },
  ],
  Events: [
    {
      img: "Choco_Box_Card.png",
      effect: effects.BoostFoodEffect,
      category: cardCategory.Events,
    },
    {
      img: "Egggulyte_Card.png",
      effect: effects.CardChance,
      category: cardCategory.Events,
    },
    {
      img: "Egg_Capsule_Card.png",
      effect: effects.CritDamage,
      category: cardCategory.Events,
    },
    {
      img: "Floofie_Card.png",
      effect: effects.MPRegen,
      category: cardCategory.Events,
    },
    {
      img: "Ghost_Card.png",
      effect: effects.MonsterExpActive,
      category: cardCategory.Events,
    },
    {
      img: "Giftmas_Blobulyte_Card.png",
      effect: effects.DropRate,
      category: cardCategory.Events,
    },
    {
      img: "Loveulyte_Card.png",
      effect: effects.TotalHp,
      category: cardCategory.Events,
    },
    {
      img: "Meaning_of_Giftmas_Card.png",
      effect: effects.MonsterMoney,
      category: cardCategory.Events,
    },
    {
      img: "Shell_Snake_Card.png",
      effect: effects.BaseLUK,
      category: cardCategory.Events,
    },
    {
      img: "Valentslime_Card.png",
      effect: effects.EquipmentDefense,
      category: cardCategory.Events,
    },
    {
      img: "Plasti_Doug_Card.png",
      effect: effects.BaseDefense,
      category: cardCategory.Events,
    },
    {
      img: "Mr_Blueberry_Card.png",
      effect: effects.DropRate,
      category: cardCategory.Events,
    },
    {
      img: "Coastiolyte_Card.png",
      effect: effects.FishingAfk,
      category: cardCategory.Events,
    },
    {
      img: "Summer_Spirit_Card.png",
      effect: effects.CatchingExp,
      category: cardCategory.Events,
    },
  ],
};

export const sortingPriority = {
  "Blunder Hills": 1,
  "Yum Yum Desert": 2,
  "Easy Resources": 3,
  "Medium Resources": 4,
  "Hard Resources": 5,
  "Frostbite Tundra": 6,
  Bosses: 7,
  Events: 8,
};

const isProd = process.env.NODE_ENV === "production";
export const prefix = isProd ? "/IdleonCardSearch/" : "";

