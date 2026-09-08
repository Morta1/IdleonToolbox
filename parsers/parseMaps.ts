export const starSignsIndicesMap = {
  'The_Book_Worm': '1',
  'The_Buff_Guy': '1a',
  'The_Fuzzy_Dice': '1b',
  'Flexo_Bendo': '2',
  'Dwarfo_Beardus': '3',
  'Hipster_Logger': '4',
  'Pie_Seas': '4a',
  'Miniature_Game': '4b',
  'Shoe_Fly': '4c',
  'Pack_Mule': '5',
  'Pirate_Booty': '6',
  'All_Rounder': '7',
  'Muscle_Man': '7a',
  'Fast_Frog': '7b',
  'Smart_Stooge': '7c',
  'Lucky_Larry': '7d',
  'Fatty_Doodoo': '8',
  'Robinhood': '9',
  'Blue_Hedgehog': '9a',
  'Ned_Kelly': '10',
  'The_Fallen_Titan': '10a',
  'Chronus_Cosmos': 'CR',
  'Activelius': '11',
  'Gum_Drop': '11a',
  'Mount_Eaterest': '12',
  'Bob_Build_Guy': '13',
  'The_Big_Comatose': '14',
  'Sir_Savvy': '14a',
  'Silly_Snoozer': '15',
  'The_Big_Brain': '15a',
  'Grim_Reaper': '16',
  'The_Forsaken': '16a',
  'The_OG_Skiller': '17',
  'Mr_No_Sleep': '18',
  'All_Rounderi': '1',
  'Centaurii': '2',
  'Murmollio': '3',
  'Strandissi': '4',
  'Agitagi': '4B',
  'Wispommo': '5',
  'Lukiris': '5B',
  'Pokaminni': '6',
  'Gor_Bowzor': '7',
  'Hydron_Cosmos': '8',
  'Trapezoidburg': '8B',
  'Sawsaw_Salala': '9',
  'Preys_Bea': '9B',
  'Cullingo': '10',
  'Gum_Drop_Major': '10B',
  'Grim_Reaper_Major': '11',
  'Sir_Savvy_Major': '12',
  'The_Bulwark': '13',
  'Big_Brain_Major': '14',
  'The_Fiesty': '15',
  'The_Overachiever': '15B',
  'Comatose_Major': '16',
  'S._Snoozer_Major': '17',
  'Breedabilli': '18',
  'Gordonius_Major': '19',
  'Power_Bowower': '19b',
  'Scienscion': '20',
  'Artifosho': '21',
  'Divividov': '22',
  'C._Shanti_Minor': '23',
  'Muscle_Magnus': 'S',
  'Cropiovo_Minor': 'A1',
  'Fabarmi': 'A2',
  'O.G._Signalais': 'A3',
  'Lightspeed_Frog': 'A4',
  'Beanbie_Major': 'A5',
  'Damarian_Major': 'A6',
  'Lotto_Larrinald': 'A7',
  'Intellostooge': 'A8',
  'S._Tealio': 'B1',
  'Sneekee_E._X.': 'B2',
  'Jadaciussi': 'B3',
  'Druipi_Major': 'B4',
  'Sumo_Magno': 'B5',
  'Killian_Maximus': 'B6',
  'Seraph_Cosmos': 'SC',
  'Glimmer_of_Beyond': 'C1'
}

// TODO: check if able to pull from Z.js
export const skillIndexMap = {
  0: { name: 'character', icon: '' },
  1: { name: 'mining', icon: 'ClassIcons42' },
  2: { name: 'smithing', icon: 'ClassIcons43' },
  3: { name: 'chopping', icon: 'ClassIcons44' },
  4: { name: 'fishing', icon: 'ClassIcons45' },
  5: { name: 'alchemy', icon: 'ClassIcons46' },
  6: { name: 'catching', icon: 'ClassIcons47' },
  7: { name: 'trapping', icon: 'ClassIcons48' },
  8: { name: 'construction', icon: 'ClassIcons49' },
  9: { name: 'worship', icon: 'ClassIcons50' },
  10: { name: 'cooking', icon: 'ClassIcons51' },
  11: { name: 'breeding', icon: 'ClassIcons52' },
  12: { name: 'laboratory', icon: 'ClassIcons53' },
  13: { name: 'sailing', icon: 'ClassIcons54' },
  14: { name: 'divinity', icon: 'ClassIcons55' },
  15: { name: 'gaming', icon: 'ClassIcons56' },
  16: { name: 'farming', icon: 'ClassIcons57' },
  17: { name: 'sneaking', icon: 'ClassIcons58' },
  18: { name: 'summoning', icon: 'ClassIcons59' },
  19: { name: 'spelunking', icon: 'ClassIcons60' },
  20: { name: 'research', icon: 'ClassIcons61' },
};

export const keysMap = {
  0: { name: 'Forest_Villa_Key', rawName: 'Key1' },
  1: { name: 'Efaunt\'s_Tomb_Key', rawName: 'Key2' },
  2: { name: 'Chizoar\'s_Cavern_Key', rawName: 'Key3' },
  3: { name: 'Troll\'s_Enclave_Key', rawName: 'Key4' },
  4: { name: 'Kruk\'s_Volcano_Key', rawName: 'Key5' }
};

export const filteredGemShopItems = ([
  'EquipmentCape0',
  'EquipmentCape2',
  'EquipmentPendant28',
  'EquipmentRings31',
  'EquipmentRings32',
  'EquipmentRings33',
  'EquipmentHats80',
  'EquipmentHats34'
] as any).toSimpleObject();

// Items that pass isGreenstackable but can never realistically reach the 10,000,000 greenstack
// threshold: their only source is a one-off quest, so an account can hold at most one per character
// and most get consumed on turn-in. They stay in the slab (they ARE obtainable), but they're kept
// out of "Missing greenstacks" and the greenstack total so 100% stays reachable. Curated rather
// than derived: the entity graph has no edges for skilling, the gem shop, events or the post
// office, so "no source in the graph" alone would wrongly flag farmable items like ores and logs.
export const unrealisticGreenstackItems = ([
  // Personal NPC tokens - one per character from that NPC's final quest, consumed to craft badges
  'NPCtoken4',
  'NPCtoken5',
  'NPCtoken6',
  'NPCtoken7',
  'NPCtoken9',
  'NPCtoken10',
  'NPCtoken11',
  'NPCtoken12',
  'NPCtoken13',
  'NPCtoken14',
  'NPCtoken16',
  'NPCtoken17',
  'NPCtoken18',
  'NPCtoken19',
  'NPCtoken20',
  'NPCtoken21',
  'NPCtoken22',
  'NPCtoken23',
  'NPCtoken24',
  'NPCtoken25',
  'NPCtoken26',
  'NPCtoken31',
  'NPCtoken32',
  'NPCtoken33',
  'NPCtoken34',
  'NPCtoken35',
  'NPCtoken36',
  'NPCtoken37',
  'NPCtoken38',
  'Quest9', // Picnic Token
  // Talent point tabs - one-off per character
  'TalentPoint1',
  'TalentPoint2',
  'TalentPoint3',
  'TalentPoint4',
  'TalentPoint5',
  'TalentPoint6',
  // One-off story quest items, handed over or received once per character
  'Quest1', // Mining Certificate
  'Quest5', // Class Certificate
  'Quest6', // Scouting Report
  'Quest10', // Green Tea
  'Quest11', // Forest Villas Flyer Thingy
  'Quest16', // Broken Mic
  'Quest20', // Signed Arrest Warrant
  'Quest25', // Birthday Card
  'Quest26', // Pre Crime Box
  'Quest27', // Bag o Nuts
  'Quest28', // IOU one W7 Crystal
  'Quest33', // Player Rating With Letter P
  'Quest34', // Player Rating With Letter S
  'Quest46', // The Bobber Challenge Scroll
  'Quest47', // Elderly Peanut
  'Quest48', // Pete the Peanut
  'Quest56', // Dootophone
  'Quest58', // Refurbished Cog
  'Quest59', // Shuvelle's Vote
  'Quest60', // Yondergreens Vote
  'Quest61', // Bill Brr's Vote
  'Quest62', // Signed Contract
  'Quest106', // Urie's Special Childhood Rock
  'PeanutS', // Stone Peanut
  'SmithingHammerChisel3', // Onyx Tools
  'SmithingHammerChisel4', // Zenith Tools
  // The groups below come from a 2.3.530 source scan cross-checked against 3,644 uploaded profiles:
  // no farmable source (drops / crafting / anvil / skilling) and at most 2 profiles have ever greenstacked them.
  // World shop only, daily stock 1-30
  'StoneW5', 'StoneW8', 'StoneW9', 'StoneA5', 'StoneA7', 'StoneA8', 'StoneT3', 'StoneT4', 'StoneT5', 'StoneT7', 'StoneT8',
  'SmithingHammerChisel', 'SmithingHammerChisel2', 'BobJoePickle', 'BoneJoePickle', 'Quest57', 'NPCtoken27', 'Quest37',
  'Quest65', 'Quest66', 'Quest67', 'Quest83', 'Quest84', 'Quest80', 'Quest86', 'Quest104', 'Quest87', 'Whetstone', 'Quest103', 'Quest105',
  'Weight1', 'Weight5', 'Weight10', 'Weight11', 'Line1', 'Line5', 'Line10',
  // Gem shop / bundle only
  'ClassSwapB', 'ClassSwapC', 'Quest38', 'Quest90', 'Quest117', 'Quest77', 'Quest96', 'Quest101', 'NPCtoken15', 'CardPack2', 'CardPack3', 'CardPack7',
  // Finite quest rewards (some also gem shop)
  'CraftMat2', 'OilBarrel4', 'ResetCompleted', 'TixCol', 'ExpBalloon2', 'ExpBalloon3', 'Pearl4', 'Pearl5', 'Quest43', 'Quest44', 'Quest70',
  'Quest72', 'Quest73', 'Quest79', 'GemP30', 'Quest81', 'Quest82', 'Quest108', 'Quest115', 'Timecandy7', 'Timecandy9',
  'StoneW6', 'StoneA1b', 'StoneHelm6', 'Quest64', 'EquipmentStatues6',
  'Weight2', 'Weight6', 'Weight8', 'Weight12', 'Weight14', 'Line2', 'Line7', 'Line11', 'CardPack1', 'CardPack4', 'CardPack5',
  // Crafted only from one-off personal NPC tokens
  'BadgeG1', 'BadgeG2', 'BadgeG3', 'BadgeD1', 'BadgeD2', 'BadgeD3', 'BadgeI1', 'BadgeI2', 'BadgeI3',
  'NPCtoken1', 'NPCtoken2', 'NPCtoken3', 'NPCtoken28', 'NPCtoken29', 'NPCtoken30', 'NPCtoken39', 'NPCtoken40', 'NPCtoken41',
  // Event only / no source in the current build
  'Quest39', 'Quest75', 'Quest85', 'Quest88', 'Quest91', 'Quest92', 'Quest109', 'Quest113', 'Quest111', 'Quest114', 'Quest119', 'Quest120',
  'Quest93', 'Quest98', 'Quest100', 'Quest107', 'Quest97', 'Quest102', 'Quest76', 'GemP36', 'StoneT1e', 'StoneHelm1b', 'StoneW3b',
  'FoodG15', 'Timecandy10', 'Line6', 'ItemsCoupon1', 'ItemsCoupon2', 'BallJoePickle', 'CaveGoldPiece',
  // Repeatable in theory, zero stackers across all profiles
  'Crystal1', 'Crystal2', 'Crystal3', 'Crystal4', 'Crystal5', 'Mayo', 'Trash', 'Trash2', 'Trash3', 'KeyFrag',
  'RGshard0', 'RGshard1', 'RGshard2', 'RGshard3', 'RGshard4', 'RGshard5', 'RGenh', 'RGenhB',
  'StoneTempestB0', 'StoneTempestB1', 'StoneTempestB2', 'StoneTempestR0', 'StoneTempestR1', 'StoneTempestR2',
  // Player reports: shop stock of 500-1000/day, gem shop only, event boxes, or crafted from rare one-off parts.
  // The handful of profiles that "stacked" these are hacked saves (the same ones hold 10M Gems)
  'OilBarrel1', 'OilBarrel5', 'FoodHealth5', 'FoodPotYe1', 'FoodPotYe3', 'OilBarrel3', 'PureWater2', 'PremiumGem',
  'Pearl1', 'Pearl2', 'Pearl3', 'Pearl6',
  'Timecandy1', 'Timecandy2', 'Timecandy3', 'Timecandy4', 'Timecandy5', 'Timecandy6',
  'FoodEvent1', 'FoodEvent2', 'FoodEvent3', 'FoodEvent4', // Giftmas event foods, 3-4 stackers
  'ClassSwap', 'ResetBox', 'CardPack6', 'Quest30', 'Quest35', 'Quest36', 'Quest40', 'Quest71', 'Quest89', 'Timecandy8',
  'EquipmentSmithingTabs4', 'EquipmentSmithingTabs5', 'EquipmentSmithingTabs6'
] as any).toSimpleObject();

export const filteredLootyItems = ([
  'Quest42',
  'Quest49',
  'Quest50',
  'EquipmentShoes2',
  'EquipmentPendant18',
  'TestObj4',
  'TestObj5',
  'TestObj8',
  'TestObj14',
  'TestObj15',
  'TestObj16',
  'EquipmentPants11',
  'EquipmentSmithingTabs7',
  'EquipmentSmithingTabs8',
  'Quest8',
  'StampB28',
  'StampB29',
  'StampB33',
  'StampB35',
  'CardsC13',
  'CardsC14',
  'CardsC15',
  'CardsD12',
  'CardsD13',
  'Trophy4',
  'Trophy7',
  'StampsA22',
  'StampsA25',
  'DoubleAFKtix',
  'ObolFrag',
  'DeliveryBox',
  'StampC17',
  'FishingRod1',
  'CatchingNet1',
  'FoodHealth8',
  'EquipmentCape1',
  'EquipmentHats72',
  'EquipmentHats55',
  'MaxCapBagFi0',
  'MaxCapBagB0',
  'MaxCapBagTr0',
  'MaxCapBagTr2',
  'MaxCapBagS0',
  'MaxCapBagS2',
  'Spice0',
  'Spice6',
  'Spice9',
  'StampC13',
  'TalentPoint5',
  // Dungeon unobtainable
  'DungWeaponSwordE5',
  'DungWeaponBowE5',
  'DungWeaponWandE5',
  'DungWeaponPunchE5',
  'DungWeaponPunchF1',
  'DungWeaponPunchF2',
  'DungWeaponPunchF3',
  'DungWeaponPunchF4',
  'DungWeaponPunchF5',
  'DungWeaponWandF1',
  'DungWeaponWandF2',
  'DungWeaponWandF3',
  'DungWeaponWandF4',
  'DungWeaponWandF5',
  'DungWeaponBowF1',
  'DungWeaponBowF2',
  'DungWeaponBowF3',
  'DungWeaponBowF4',
  'DungWeaponBowF5',
  'DungWeaponSwordF1',
  'DungWeaponSwordF2',
  'DungWeaponSwordF3',
  'DungWeaponSwordF4',
  'DungWeaponSwordF5',
] as any).toSimpleObject();

export const skillsMaps = {
  mining: ([6, 7, 9, 10, 11] as any).toSimpleObject(),
  fishing: ([54, 55, 61] as any).toSimpleObject()
}