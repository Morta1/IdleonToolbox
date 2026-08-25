export const items = {
  Copper: { displayName: 'Copper_Ore', Type: 'ORE', typeGen: 'bOre', ID: 5 },
  CraftMat1: { displayName: 'Thread', Type: 'MATERIAL', typeGen: 'bCraft', ID: 1 },
  EquipmentShirts1: { displayName: 'Orange_Tee', Type: 'SHIRT', typeGen: 'aShirt', ID: 2 },
  Quest14: { displayName: 'Employment_Statistics', Type: 'QUEST_ITEM', typeGen: 'qItem', ID: 3 },
  StoneT2: { displayName: 'Tool_Upgrade_Stone_II', Type: 'UPGRADE', typeGen: 'dStone', ID: 4 },
  Grasslands1: { displayName: 'Spore_Cap', Type: 'MATERIAL', typeGen: 'bCraft', ID: 6 },
  SmithingRecipes2: { displayName: 'Novice_Recipe', Type: 'ANVIL_RECIPE', typeGen: 'dRecipe', ID: 7 },
  Quest36: { displayName: 'Dootjat_Eye', Type: 'SUMMON_ITEM', typeGen: 'dQuest', ID: 8 },
  TalentBook1: { displayName: 'Special_Talent_Book', Type: 'TALENT_BOOK', typeGen: 'dBook', ID: 9 },
};

export const monsters = {
  mushG: { Name: 'Green_Mushroom', AFKtype: 'FIGHTING', Type: 'Monster' },
  Copper: { Name: 'Copper_Ore_Node', AFKtype: 'MINING', Type: 'Ore' },
  // The game's own placeholder name for a cut or internal spawner. Seven monsters carry it.
  behemoth: { Name: 'Error', AFKtype: 'error', Type: 'Monster' },
};

// StoneT2 sits two tables deep, so its `chance` (85% within its table) and its
// `effectiveChance` (0.5% * 0.5% * 85%) differ by four orders of magnitude.
export const monsterDrops = {
  mushG: [
    {
      rawName: 'Grasslands1', quantity: 1, chance: 0.35, questLink: 'N/A',
      dropTable: null, dropTablePath: [], tableChance: 1, effectiveChance: 0.35,
    },
    {
      rawName: 'COIN', quantity: 3, chance: 1, questLink: 'N/A',
      dropTable: null, dropTablePath: [], tableChance: 1, effectiveChance: 1,
    },
    // The placeholder the game writes for a nested table's own slot. 697 of these exist and none
    // of them can drop, so mushG listed Coin twice before they were filtered.
    {
      rawName: 'COIN', quantity: 1, chance: 0, questLink: 'N/A',
      dropTable: 'DropTable3', dropTablePath: ['DropTable3'], tableChance: 0.000025,
      effectiveChance: 0,
    },
    {
      rawName: 'StoneT2', quantity: 1, chance: 0.85, questLink: 'N/A',
      dropTable: 'SuperDropTable1', dropTablePath: ['DropTable3', 'SuperDropTable1'],
      tableChance: 0.000025, effectiveChance: 0.00002125,
    },
    // z-processing decodes the recipe's packed id, so the drop arrives naming the item it
    // teaches. These are the Sand Giant's real values for it.
    {
      rawName: 'SmithingRecipes2', quantity: 1, chance: 0.000017, questLink: 'N/A',
      recipeItem: 'Quest36', recipeItemName: 'Dootjat_Eye',
      dropTable: null, dropTablePath: [], tableChance: 1, effectiveChance: 0.000017,
    },
    // Two books at identical odds from one table: only the talent tells them apart.
    {
      rawName: 'TalentBook1', quantity: 1, chance: 0.1, questLink: 'N/A',
      talentName: 'ROLL_DA_DICE', talentLevel: 100,
      dropTable: 'SuperDropTable1', dropTablePath: ['SuperDropTable1'],
      tableChance: 0.000012, effectiveChance: 0.0000012,
    },
    {
      rawName: 'TalentBook1', quantity: 1, chance: 0.1, questLink: 'N/A',
      talentName: 'ATTACKS_ON_SIMMER', talentLevel: 50,
      dropTable: 'SuperDropTable1', dropTablePath: ['SuperDropTable1'],
      tableChance: 0.000012, effectiveChance: 0.0000012,
    },
  ],
  behemoth: [
    {
      rawName: 'Copper', quantity: 1, chance: 1, questLink: 'N/A',
      dropTable: null, dropTablePath: [], tableChance: 1, effectiveChance: 1,
    },
  ],
};

export const crafts = {
  Orange_Tee: {
    rawName: 'EquipmentShirts1', itemName: 'Orange_Tee', itemQuantity: 1,
    materials: [{ rawName: 'CraftMat1', itemName: 'Thread', itemQuantity: 1 }],
  },
};

export const quests = {
  TP_Pete: {
    1: {
      Type: 'Custom', QuestName: 'TP_Pete1', Name: 'Retribution_Time', NextIndex: 4,
      DialogueText: 'THOSE_RATS_AGAIN..._@_QUEST:Go_defeat_10_rats_in_the_sewers',
      Difficulty: '2', ConsumeItems: false,
      customArray: [{ desc: 'Rats_Defeated:', value: 10 }],
      rewards: [{ rawName: 'StoneT2', name: 'Tool_Upgrade_Stone_II', amount: 2 }],
    },
    2: {
      Type: 'ItemsAndSpaceRequired', QuestName: 'TP_Pete2', Name: 'The_Rats_are_to_Blame', NextIndex: 7,
      // One real quest's Difficulty is the string '4f', and this one has no QUEST: brief.
      DialogueText: 'JUST_CHATTER,_NO_BRIEF_HERE', Difficulty: '4f', ConsumeItems: true,
      itemReq: [{ rawName: 'Quest14', name: 'Employment_Statistics', amount: 50 }],
      rewards: [{ rawName: 'ExpBalloon99', name: 'Missing_Balloon', amount: 2 }],
    },
    sprite: 'x', spriteAcross: 1, spriteDown: 1, spriteNumFrames: 1,
  },
};

// Two shops: one named, and Copper is sold in the same shop that sells Thread so the item panel
// has a "Sold by" row to render.
export const shops = {
  0: {
    name: 'Blunder_Hills',
    items: [
      { name: 'Thread', rawName: 'CraftMat1' },
      { name: 'Copper_Ore', rawName: 'Copper' }
    ]
  }
};
