import { getActiveBubbleBonus, getBubbleBonus, getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getStarSignBonus } from '@parsers/starSigns';
import { getCookingEffParts, getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import {
  checkCharClass,
  CLASSES,
  getCharacterByHighestTalent,
  getHighestTalentByClass, getMaestroHand,
  getTalentBonus,
  getTalentBonusIfActive,
  mainStatMap
} from '@parsers/talents';
import {
  calcTotalQuestCompleted,
  getFriendBonus,
  getGoldenFoodMultiplier,
  getMinigameScore,
  getSkillMasteryBonusByIndex,
  getSkillCardBonus,
  isCompanionBonusActive,
  isMasteryBonusUnlocked
} from '@parsers/misc';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { bonuses } from '@website-data';
import { calculateItemTotalAmount, getStatsFromGear } from '@parsers/items';
import { getJewelBonus, getLabBonus, getLabEfficiencyParts } from '@parsers/world-4/lab';
import { getCardBonusByEffect, getCardLevel, getEquippedCardBonus } from '@parsers/cards';
import { getPaletteBonus } from '@parsers/world-5/gaming';
import { getPrayerBonusAndCurse } from '@parsers/world-3/prayers';
import { getGuildBonusBonus } from '@parsers/guild';
import { TOOLS } from '@utility/consts';
import { getStatueBonus } from '@parsers/world-1/statues';
import { getStampsBonusByEffect, getStampsBonusByStat } from '@parsers/world-1/stamps';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { getObolsBonus } from '@parsers/obols';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { cleanUnderscore, lavaLog, notateNumber } from '@utility/helpers';
import {
  additiveGroup,
  createBreakdown,
  evaluateBreakdownNode,
  flat,
  multiplier,
  percent,
  productGroup,
  sumGroup
} from '@parsers/breakdown';
import type { BreakdownLine } from '@parsers/breakdown';
import { getAchievementStatus } from '@parsers/achievements';
import { getBribeBonus } from '@parsers/world-1/bribes';
import { getKangarooBonus } from '@parsers/world-2/kangaroo';
import { getSpelunkingEfficiencyParts } from '@parsers/world-7/spelunking';
import { getTrappingStuff } from '@parsers/character';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getWinnerBonus } from '@parsers/world-6/summoning';

export const allProwess = (character: any, account: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const prowessBubble = getBubbleBonus(account, 'PROWESESSARY', false, false);
  const starSignProwess = getStarSignBonus(character, account, 'All_Skill_Prowess');
  const skillProwessMeals = getMealsBonusByEffectOrStat(account, null, 'Sprow');
  return Math.max(0, Math.min(.1, (prowessBubble - 1) / 10 + (.001 * (starSignProwess) + 5e-4 * skillProwessMeals)));
}

export const getNobisectBonus = (character: any, account: any, characters: any, playerInfo: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const { strength, wisdom, agility } = character?.stats || {};
  const strBubbleBonus = getBubbleBonus(account, 'HEARTY_DIGGY', false, mainStat === 'strength');
  const wisBubbleBonus = getBubbleBonus(account, 'HOCUS_CHOPPUS', false, mainStat === 'wisdom');
  const base = Math.max(1, getAllEff(character, characters, account)
    + Math.pow(((strBubbleBonus * lavaLog(playerInfo?.maxHp))
      + (wisBubbleBonus * lavaLog(playerInfo?.maxMp))) / 100, 2)
    + Math.pow((strength
      + (wisdom
        + agility)) / 3, 0.5) / 7);
  const nubisect = account?.divinity?.deities?.[2];
  return (nubisect?.level ?? 0)
    * (nubisect?.blessingMultiplier ?? 0)
    * Math.min(1.8, Math.max(0.1, 4
      * Math.pow(((base + 1e4)
        / Math.max(10 * base + 10, 1)) * 0.01, 2)));
}

// game: "AllBaseSkillEff", a plain sum
export const getAllBaseSkillEffBreakdown = (character: any, account: any, characters: any, playerInfo: any) => {
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Base_Efficiency_for_All_Skills')
  const stampBonus = getStampsBonusByEffect(account, 'All_Skill_Efficiency', character);
  const blessingBonus = getNobisectBonus(character, account, characters, playerInfo);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Myriad_Crate', 1);
  const chipBonus = account?.lab?.playersChips?.[character?.playerId].find((chip: any) => chip.index === 11)?.baseVal ?? 0;
  const talentBonus = getTalentBonus(character?.flatStarTalents, 'SUPERSOURCE');
  const spelunkerObolMulti = getLabBonus(account?.lab?.labBonuses, 8); // gem multi
  const jewelBonus = getJewelBonus(account?.lab.jewels, 12, spelunkerObolMulti);
  const allGreenActive = account.lab.jewels?.slice(11, 16)?.every(({ active }: any) => active) ? 2 : 1;

  return sumGroup('All base skill efficiency', [
    flat('Shiny', shinyBonus),
    flat('Stamp', stampBonus),
    flat('Nobisect blessing', blessingBonus),
    flat('Post office', postOfficeBonus),
    flat('Chip', chipBonus),
    flat('Supersource talent', talentBonus),
    flat('Jewel', jewelBonus * allGreenActive)
  ]);
}

export const getAllBaseSkillEff = (character: any, account: any, characters: any, playerInfo: any) =>
  evaluateBreakdownNode(getAllBaseSkillEffBreakdown(character, account, characters, playerInfo));

// game: SkillStats("AllEfficiencies"), the product of these groups
export const getAllEffBreakdown = (character: any, characters: any, account: any) => {
  // FamBonusQTYs[42], as the played character sees it
  const familyEffBonus = character?.familyBonuses?.[CLASSES.Hunter] ?? 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, '6SkillEff');
  const { value: effFromEquipment } = getStatsFromGear(character, 48, account);
  const effFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[48]);
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Frost_Relic')?.bonus ?? 0;
  const talentBonus = getTalentBonus(character?.flatStarTalents, 'STUDIOUS_QUESTER');
  // game: ArbitraryCode("TotalQuestsComplete") - unique quests done across the account (TomeQTY[4])
  const totalQuests = Number(calcTotalQuestCompleted(characters)) || 0;
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Seff');
  const tomeBonus = account?.tome?.bonuses?.[1]?.bonus ?? 0;
  const chipBonus = account?.lab?.playersChips?.[character?.playerId]?.find((chip: any) => chip.index === 11)?.baseVal ?? 0;
  // game: 3 * CardLv("Crystal4")
  const cardBonus = getCardLevel(account?.cards, 'Crystal4');
  const multitoolBonus = getTalentBonus(character?.flatStarTalents, 'ANCIENT_MULTITOOL');
  const paletteBonus = getPaletteBonus(account, 10) ?? 0;
  const friendBonus = getFriendBonus(account, 2) ?? 0;
  const option422 = Number(account?.accountOptions?.[422]) || 0;
  const masteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 2)
  const schematicBonus = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 49, i: 15 });
  const chaoticTrollBonus = getEquippedCardBonus(character?.cards, 'Boss4B' as any);
  const companionBonus = isCompanionBonusActive(account, 5) ? account?.companions?.list?.at(5)?.bonus : 0;
  const winnerBonus = getWinnerBonus(account, '<x Skill Effncy.');

  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet2' ? character?.cards?.cardSet?.bonus : 0;
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Skilled_Dimwit', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Proficiency', account)?.curse;
  const secondTalentBonus = getTalentBonusIfActive(character?.activeBuffs, 'MAESTRO_TRANSFUSION');
  let guildBonus = 0;
  if (account?.guild?.guildBonuses?.length > 0) {
    guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 6);
  }

  return productGroup('All efficiencies', [
    additiveGroup('Family, gear, vial and quests', [
      percent('Family', familyEffBonus),
      percent('Gear', effFromEquipment),
      percent('Obols', effFromObols),
      percent('Vial', vialBonus),
      percent('Frost Relic artifact', artifactBonus),
      percent('Studious Quester talent', Math.min(0.1 * totalQuests, talentBonus))
    ]),
    additiveGroup('Meal, tome and more', [
      percent('Meal', mealBonus),
      percent('Ancient Multitool talent', multitoolBonus),
      percent('Tome', tomeBonus),
      percent('Palette', paletteBonus),
      percent('Chip', chipBonus),
      percent('Card', 3 * cardBonus),
      percent('Friend', friendBonus),
      percent('Skill mastery', masteryBonus),
      percent('Schematic', schematicBonus),
      percent('Account bonus', option422),
      percent('Island shimmer', (account?.accountOptions?.[180] ?? 0) * account?.islands?.allShimmerBonus)
    ]),
    additiveGroup('Chaotic Troll card and companion', [
      percent('Chaotic Troll card', chaoticTrollBonus),
      percent('Companion', companionBonus)
    ]),
    additiveGroup('Summoning', [percent('Summoning', winnerBonus)]),
    additiveGroup('Guild, card set and prayer', [
      percent('Guild', guildBonus),
      percent('Card set', cardSetBonus),
      percent('Prayer', prayerBonus)
    ]),
    multiplier('Maestro Transfusion, prayer curse (min 0.01)', Math.max(1 - (secondTalentBonus + prayerCurse) / 100, 0.01))
  ]);
}

export const getAllEff = (character: any, characters: any, account: any) =>
  evaluateBreakdownNode(getAllEffBreakdown(character, characters, account));

const bubbleLabel = (bubbleName: string) => `${(cleanUnderscore(bubbleName)?.toLowerCase() as any)?.capitalizeAllWords()} bubble`;

interface SkillPowerOptions {
  tool: number;
  // The tool line's label, e.g. "Pickaxe (Tool Proficiency, Stronk Tools)"
  toolLabel: string;
  toolMultiplier: number;
  flatBase: number;
  statueIndex: number;
  // Slab bubble (power per 100 slab items) and endgame bubble (power per 10 class levels past 500)
  slabBubble: string;
  endgameBubble: string;
  classBubbleMultiplier: boolean;
  extraLines?: BreakdownLine[];
}

// game: the start of every gathering skill's SkillStats: the tool's Weapon_Power scaled by its bubble, a flat
// amount, then TotalStats("<Skill>_Power"), which adds the tool again, a statue and the slab and endgame bubbles.
const getSkillPowerLines = (character: any, account: any, options: SkillPowerOptions): BreakdownLine[] => {
  const effFromTool = character?.tools?.[options.tool]?.Weapon_Power || 0;
  const slabItems = Math.floor((account?.looty?.rawLootedItems ?? 0) / 100);
  const endgameLevels = Math.max(1, Math.floor((character?.level - 500) / 10));
  return [
    flat(options.toolLabel, effFromTool * options.toolMultiplier),
    flat('Base', options.flatBase),
    flat('Tool', effFromTool),
    flat('Statue', getStatueBonus(account, options.statueIndex, character?.flatTalents)),
    flat(bubbleLabel(options.slabBubble), getBubbleBonus(account, options.slabBubble, false, options.classBubbleMultiplier) * slabItems),
    flat(bubbleLabel(options.endgameBubble), getBubbleBonus(account, options.endgameBubble, false, options.classBubbleMultiplier) * endgameLevels),
    ...(options.extraLines ?? [])
  ];
}

// game: SkillStats("MiningEfficiency"): 12 + base power * every multiplier
const getMiningEffParts = (character: any, characters: any, account: any, playerInfo: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const talentBonus = getTalentBonus(character?.flatTalents, 'TOOL_PROFICIENCY');
  const bubbleBonus = getBubbleBonus(account, 'STRONK_TOOLS', false, mainStat === 'strength');
  const miningLevel = character?.skillsInfo?.mining?.level;
  const miningPowerLines = getSkillPowerLines(character, account, {
    tool: TOOLS.PICKAXE,
    toolLabel: 'Pickaxe (Tool Proficiency, Stronk Tools)',
    toolMultiplier: (1 + talentBonus * (miningLevel / 10) / 100) * (1 + bubbleBonus / 100),
    flatBase: 4,
    statueIndex: 2,
    slabBubble: 'SLABI_OREFISH',
    endgameBubble: 'ENDGAME_EFF_I',
    classBubbleMultiplier: mainStat === 'strength'
  });
  const baseMiningEff = evaluateBreakdownNode(sumGroup('Mining power', miningPowerLines));

  const secondTalentBonus = getTalentBonus(character?.flatTalents, 'SKILL_STRENGTHEN');
  const stampBonus = getStampsBonusByEffect(account, 'Base_Mining', character);
  const allBaseSkillEff = getAllBaseSkillEff(character, account, characters, playerInfo);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Dwarven_Supplies', 0);
  const rightHandBonus = getMaestroHand(character, 'mining', characters, account, 'RIGHT_HAND_OF_ACTION');
  const goldenFoodMulti = getGoldenFoodMultiplier('Golden_Peanut', character, account, characters);
  const thirdTalentBonus = getTalentBonus(character?.flatTalents, 'BRUTE_EFFICIENCY');
  const { value: etcFromGear } = getStatsFromGear(character, 10, account);
  const etcFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[10]);
  const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.mining?.rank, 1);
  const cardBonus = getSkillCardBonus(character, account, 'mining', 'Total_Mining_Efficiency');
  const voteBonus = getVoteBonus(account, 7);
  const copperSetBonus = getArmorSetBonus(account, 'COPPER_SET');
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 0 });
  const starSignBonus = getStarSignBonus(character, account, 'Mining_Efficency');
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'MinEff');
  const thirdBubbleBonus = getBubbleBonus(account, 'HEARTY_DIGGY', false, mainStat === 'strength');
  const fourthTalentBonus = getTalentBonus(character?.flatTalents, 'COPPER_COLLECTOR');
  const atomBonus = getAtomBonus(account, 'Helium_-_Talent_Power_Stacker');
  const copperOwned = calculateItemTotalAmount(account?.storage?.list, 'Copper_Ore', true);
  const allEfficiencies = getAllEff(character, characters, account);

  const value = 12 + (Math.pow(baseMiningEff, 1.3)
      + (Math.pow(character?.stats?.strength + 1, .6)
        * (1 + secondTalentBonus / 100)
        + (stampBonus
          + allBaseSkillEff)))
    * (1 + miningLevel / 200)
    * (1 + (postOfficeBonus
      + rightHandBonus) / 100)
    * (1 + Math.pow(character?.stats?.strength / 100, .35)
      * (1 + secondTalentBonus / 100))
    * goldenFoodMulti
    * (1 + (thirdTalentBonus
      + ((etcFromGear + etcFromObols)
        + (10 * masteryBonus + (voteBonus + copperSetBonus)))) / 100)
    * (1 + (cardBonus
      + (starSignBonus
        + (vialBonus + monumentBonus))) / 100)
    * (1 + baseMiningEff / 100)
    * 1 // BIG PICK
    * (1 + thirdBubbleBonus * lavaLog(playerInfo?.maxHp) / 100)
    * (1 + fourthTalentBonus
      * (atomBonus
        + lavaLog(copperOwned)) / 100)
    * allEfficiencies;

  const tree = [
    flat('Base', 12, { note: 'Every character starts at 12' }),
    sumGroup('Base power', [
      sumGroup('Mining power ^ 1.3', miningPowerLines, { power: 1.3, note: 'Mining power also multiplies below' }),
      flat('Strength', Math.pow(character?.stats?.strength + 1, .6) * (1 + secondTalentBonus / 100)),
      flat('Stamp', stampBonus),
      getAllBaseSkillEffBreakdown(character, account, characters, playerInfo)
    ]),
    productGroup('Multipliers', [
      multiplier('Mining level', 1 + miningLevel / 200),
      multiplier('Strength', 1 + Math.pow(character?.stats?.strength / 100, .35) * (1 + secondTalentBonus / 100)),
      multiplier('Golden food', goldenFoodMulti),
      multiplier('Mining power', 1 + baseMiningEff / 100),
      multiplier('Hearty Diggy bubble', 1 + thirdBubbleBonus * lavaLog(playerInfo?.maxHp) / 100),
      multiplier('Copper Collector talent', 1 + fourthTalentBonus * (atomBonus + lavaLog(copperOwned)) / 100),
      getAllEffBreakdown(character, characters, account),
      additiveGroup('Post office and right hand', [
        percent('Post office', postOfficeBonus),
        percent('Right Hand of Action', rightHandBonus)
      ]),
      additiveGroup('Talent, gear and mastery', [
        percent('Brute Efficiency talent', thirdTalentBonus),
        percent('Gear', etcFromGear),
        percent('Obols', etcFromObols),
        percent('Skill mastery', 10 * masteryBonus),
        percent('Vote', voteBonus),
        percent('Copper set', copperSetBonus)
      ]),
      additiveGroup('Card, star sign, vial and monument', [
        percent('Card', cardBonus),
        percent('Star sign', starSignBonus),
        percent('Vial', vialBonus),
        percent('Monument', monumentBonus)
      ])
    ])
  ];
  return { value, tree };
}

export const getMiningEff = (character: any, characters: any, account: any, playerInfo: any) =>
  getMiningEffParts(character, characters, account, playerInfo).value;

// game: SkillStats("ChoppinEfficiency"): 8 + base power * every multiplier
const getChoppingEffParts = (character: any, characters: any, account: any, playerInfo: any) => {
  const isWisdom = mainStatMap?.[character?.class] === 'wisdom';
  const talents = character?.flatTalents;
  const level = character?.skillsInfo?.chopping?.level;
  const powerLines = getSkillPowerLines(character, account, {
    tool: TOOLS.HATCHET,
    toolLabel: 'Hatchet (Le Brain Tools)',
    toolMultiplier: 1 + getBubbleBonus(account, 'LE_BRAIN_TOOLS', false, isWisdom) / 100,
    flatBase: 4,
    statueIndex: 6,
    slabBubble: 'SLABE_LOGSOUL',
    endgameBubble: 'ENDGAME_EFF_III',
    classBubbleMultiplier: isWisdom
  });
  const power = evaluateBreakdownNode(sumGroup('Choppin power', powerLines));
  const wisdom = character?.stats?.wisdom;
  const deforesting = getTalentBonus(talents, 'DEFORESTING_ALL_DOUBT');
  const skillWiz = getTalentBonus(talents, 'SKILL_WIZ');
  const leaves = calculateItemTotalAmount(account?.storage?.list, 'Leaf1', true, true);
  const { value: gear } = getStatsFromGear(character, 11, account);

  const tree = [
    flat('Base', 8, { note: 'Every character starts at 8' }),
    sumGroup('Base power', [
      sumGroup('Choppin power ^ 1.3', powerLines, { power: 1.3, note: 'Choppin power also multiplies below' }),
      flat('Wisdom', Math.pow((wisdom + 2) * (1 + deforesting / 100) * (1 + skillWiz / 100), 0.6)),
      flat('Stamp', getStampsBonusByStat(account, 'BaseChopEff', character)),
      getAllBaseSkillEffBreakdown(character, account, characters, playerInfo)
    ]),
    productGroup('Multipliers', [
      multiplier('Choppin level', 1 + level / 200),
      multiplier('Wisdom', 1 + Math.pow(wisdom * (1 + deforesting / 100) / 100, 0.35) * (1 + skillWiz / 100)),
      multiplier('Choppin power', 1 + power / 100),
      multiplier('Leaf Thief talent', 1 + getTalentBonus(talents, 'LEAF_THIEF') * lavaLog(leaves) / 100),
      getAllEffBreakdown(character, characters, account),
      additiveGroup('Post office, right hand and star sign', [
        percent('Post office', getPostOfficeBonus(character?.postOffice, 'Taped_Up_Timber', 0)),
        percent('Right Hand of Action', getMaestroHand(character, 'chopping', characters, account, 'RIGHT_HAND_OF_ACTION')),
        percent('Star sign', getStarSignBonus(character, account, 'Chop_Efficiency'))
      ]),
      additiveGroup('Hocus Choppus bubble and monument', [
        percent('Hocus Choppus bubble', getBubbleBonus(account, 'HOCUS_CHOPPUS', false, isWisdom) * lavaLog(playerInfo?.maxMp)),
        percent('Monument', getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 0 }))
      ]),
      additiveGroup('Talent, gear and mastery', [
        percent('Smart Efficiency talent', getTalentBonus(talents, 'SMART_EFFICIENCY')),
        percent('Gear', gear),
        percent('Obols', getObolsBonus(character?.obols, bonuses?.etcBonuses?.[11])),
        percent('Skill mastery', 10 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.chopping?.rank, 1)),
        percent('Vote', getVoteBonus(account, 9)),
        percent('Copper set', getArmorSetBonus(account, 'COPPER_SET'))
      ]),
      additiveGroup('Card, vial and achievement', [
        percent('Card', getSkillCardBonus(character, account, 'chopping', 'Total_Choppin_Efficiency')),
        percent('Vial', getVialsBonusByStat(account?.alchemy?.vials, 'ChopEff')),
        percent('Achievement', 10 * getAchievementStatus(account?.achievements, 352))
      ])
    ])
  ];
  const value = evaluateBreakdownNode(tree[0]) + evaluateBreakdownNode(tree[1]) * evaluateBreakdownNode(tree[2]);
  return { value, tree };
}

// game: SkillStats("FishingEfficiency"): base power * every multiplier
const getFishingEffParts = (character: any, characters: any, account: any, playerInfo: any) => {
  const isStrength = mainStatMap?.[character?.class] === 'strength';
  const talents = character?.flatTalents;
  const level = character?.skillsInfo?.fishing?.level;
  const powerLines = getSkillPowerLines(character, account, {
    tool: TOOLS.ROD,
    toolLabel: 'Fishing rod (Stronk Tools)',
    toolMultiplier: 1 + getBubbleBonus(account, 'STRONK_TOOLS', false, isStrength) / 100,
    flatBase: 3,
    statueIndex: 8,
    slabBubble: 'SLABI_OREFISH',
    endgameBubble: 'ENDGAME_EFF_I',
    classBubbleMultiplier: isStrength,
    extraLines: [
      flat('Fishing toolkit', (character?.fishingKit?.bait?.pow ?? 0) + (character?.fishingKit?.line?.pow ?? 0)),
      // game: min(fishing minigame highscore, getbonus2(2, 116))
      flat("Bobbin' Bobbers talent", Math.min(getMinigameScore(account, 'fishing'), getTalentBonus(talents, "BOBBIN'_BOBBERS", true)))
    ]
  });
  const power = evaluateBreakdownNode(sumGroup('Fishing power', powerLines));
  const strength = character?.stats?.strength;
  const skillStrengthen = getTalentBonus(talents, 'SKILL_STRENGTHEN');
  const strengthScaling = skillStrengthen
    + 10 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.fishing?.rank, 1)
    + getVoteBonus(account, 8)
    + getArmorSetBonus(account, 'PLATINUM_SET')
    + 15 * getBribeBonus(account?.bribes, 'Fishermaster')
    + getStampsBonusByStat(account, 'FishEffPerLv', character) * level;
  const { value: gear } = getStatsFromGear(character, 19, account);

  const tree = [
    sumGroup('Base power', [
      sumGroup('Fishing power ^ 1.3', powerLines, { power: 1.3, note: 'Fishing power also multiplies below' }),
      flat('Strength', Math.pow(strength, 0.6) * (1 + skillStrengthen / 100)),
      flat('Stamp', getStampsBonusByStat(account, 'BaseFishEff', character)),
      getAllBaseSkillEffBreakdown(character, account, characters, playerInfo)
    ]),
    productGroup('Multipliers', [
      multiplier('Fishing level', 1 + level / 200),
      {
        ...multiplier('Strength', 1 + Math.pow(strength / 100, 0.35) * (1 + strengthScaling / 100)),
        note: 'Scaled by Skill Strengthen, skill mastery, vote, Platinum set, Fishermaster bribe and the per-level stamp'
      },
      multiplier('Fishing power', 1 + power / 100),
      multiplier('Golden food', getGoldenFoodMultiplier('Golden_Ribs', character, account, characters)),
      multiplier('Brute Efficiency talent', 1 + getTalentBonus(talents, 'BRUTE_EFFICIENCY') / 100),
      multiplier('Star sign', 1 + getStarSignBonus(character, account, 'Fishin_Efficency') / 100),
      getAllEffBreakdown(character, characters, account),
      additiveGroup('Post office and right hand', [
        percent('Post office', getPostOfficeBonus(character?.postOffice, 'Sealed_Fishheads', 0)),
        percent('Right Hand of Action', getMaestroHand(character, 'fishing', characters, account, 'RIGHT_HAND_OF_ACTION'))
      ]),
      additiveGroup('Card, vial, gear and kangaroo', [
        percent('Card', getSkillCardBonus(character, account, 'fishing', 'Total_Fishing_Efficiency')),
        percent('Vial', getVialsBonusByStat(account?.alchemy?.vials, 'FishEff')),
        percent('Gear', gear),
        percent('Obols', getObolsBonus(character?.obols, bonuses?.etcBonuses?.[19])),
        percent('Kangaroo', getKangarooBonus(account?.kangaroo?.bonuses, 'Fishing Eff') ?? 0)
      ])
    ])
  ];
  const value = evaluateBreakdownNode(tree[0]) * evaluateBreakdownNode(tree[1]);
  return { value, tree };
}

// game: SkillStats("CatchingEfficiency"): base power * every multiplier
const getCatchingEffParts = (character: any, characters: any, account: any, playerInfo: any) => {
  const isAgility = mainStatMap?.[character?.class] === 'agility';
  const talents = character?.flatTalents;
  const level = character?.skillsInfo?.catching?.level;
  const powerLines = getSkillPowerLines(character, account, {
    tool: TOOLS.NET,
    toolLabel: 'Net (Sanic Tools)',
    toolMultiplier: 1 + getBubbleBonus(account, 'SANIC_TOOLS', false, isAgility) / 100,
    flatBase: 3,
    statueIndex: 9,
    slabBubble: 'SLABO_CRITTERBUG',
    endgameBubble: 'ENDGAME_EFF_II',
    classBubbleMultiplier: isAgility
  });
  const power = evaluateBreakdownNode(sumGroup('Catching power', powerLines));
  const agility = character?.stats?.agility * (1 + getTalentBonus(talents, 'BRIAR_PATCH_RUNNER') / 100);
  const ambidexterity = getTalentBonus(talents, 'SKILL_AMBIDEXTERITY');
  const oakLogs = calculateItemTotalAmount(account?.storage?.list, 'OakTree', true, true);
  const { value: gear } = getStatsFromGear(character, 18, account);

  const tree = [
    sumGroup('Base power', [
      sumGroup('Catching power ^ 1.3', powerLines, { power: 1.3, note: 'Catching power also multiplies below' }),
      flat('Agility', Math.pow(agility, 0.6) * (1 + ambidexterity / 100)),
      flat('Stamp', getStampsBonusByStat(account, 'BaseCatchEff', character)),
      getAllBaseSkillEffBreakdown(character, account, characters, playerInfo)
    ]),
    productGroup('Multipliers', [
      multiplier('Catching level', 1 + level / 200),
      multiplier('Agility', 1 + Math.pow(agility / 100, 0.35) * (1 + ambidexterity / 100)),
      {
        ...multiplier('Catching power', 1 + (power + Math.min(5, 5 * getAchievementStatus(account?.achievements, 74))) / 100),
        note: 'Includes up to +5 from an achievement'
      },
      multiplier("Teleki'net'ic Logs talent", 1 + getTalentBonus(talents, "TELEKI'NET'IC_LOGS")
        * (getAtomBonus(account, 'Helium_-_Talent_Power_Stacker') + lavaLog(oakLogs)) / 100),
      multiplier('Elusive Efficiency talent', 1 + getTalentBonus(talents, 'ELUSIVE_EFFICIENCY') / 100),
      getAllEffBreakdown(character, characters, account),
      additiveGroup('Card, vial, monument, gear and more', [
        percent('Card', getSkillCardBonus(character, account, 'catching', 'Total_Catching_Efficiency')),
        percent('Vial', getVialsBonusByStat(account?.alchemy?.vials, 'CatchEff')),
        percent('Monument', getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 1, i: 0 })),
        percent('Skill mastery', 10 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.catching?.rank, 1)),
        percent('Vote', getVoteBonus(account, 10)),
        percent('Platinum set', getArmorSetBonus(account, 'PLATINUM_SET')),
        percent('Gear', gear),
        percent('Obols', getObolsBonus(character?.obols, bonuses?.etcBonuses?.[18])),
        percent('Achievement', 10 * getAchievementStatus(account?.achievements, 351))
      ]),
      additiveGroup('Post office, right hand and star sign', [
        percent('Post office', getPostOfficeBonus(character?.postOffice, 'Bug_Hunting_Supplies', 0)),
        percent('Right Hand of Action', getMaestroHand(character, 'catching', characters, account, 'RIGHT_HAND_OF_ACTION')),
        percent('Star sign', getStarSignBonus(character, account, 'Catch_Efficiency'))
      ])
    ])
  ];
  const value = evaluateBreakdownNode(tree[0]) * evaluateBreakdownNode(tree[1]);
  return { value, tree };
}

// game: skillstats2("TrappingEfficiency"): (10 + scaled base power) * every multiplier
const getTrappingEffParts = (character: any, characters: any, account: any, playerInfo: any) => {
  const isAgility = mainStatMap?.[character?.class] === 'agility';
  const talents = character?.flatTalents;
  const level = character?.skillsInfo?.trapping?.level;
  const powerLines = getSkillPowerLines(character, account, {
    tool: TOOLS.TRAP,
    toolLabel: 'Trap (Sanic Tools)',
    toolMultiplier: 1 + getBubbleBonus(account, 'SANIC_TOOLS', false, isAgility) / 100,
    flatBase: 4,
    statueIndex: 15,
    slabBubble: 'SLABO_CRITTERBUG',
    endgameBubble: 'ENDGAME_EFF_II',
    classBubbleMultiplier: isAgility
  });
  const critters = calculateItemTotalAmount(account?.storage?.list, 'Critter1', true, true);
  const tree = [
    sumGroup('Base efficiency', [
      flat('Base', 10, { note: 'Every character starts at 10' }),
      productGroup('Scaled base power', [
        sumGroup('Base power', [
          sumGroup('Trapping power ^ 1.3', powerLines, { power: 1.3 }),
          flat('Agility', Math.pow(character?.stats?.agility + 1, 0.6) * (1 + getTalentBonus(talents, 'SKILL_AMBIDEXTERITY') / 100)),
          flat('Stamp', getStampsBonusByStat(account, 'TrappingEff', character)),
          getAllBaseSkillEffBreakdown(character, account, characters, playerInfo)
        ]),
        multiplier('Trapping level', 1 + level / 100),
        multiplier('Right Hand of Action', 1 + getMaestroHand(character, 'trapping', characters, account, 'RIGHT_HAND_OF_ACTION') / 100),
        getAllEffBreakdown(character, characters, account)
      ], { unit: 'flat' })
    ]),
    productGroup('Multipliers', [
      additiveGroup('Call Me Ash bubble and mastery', [
        percent('Call Me Ash bubble', getActiveBubbleBonus(character?.equippedBubbles, 'CALL_ME_ASH', account)),
        percent('Skill mastery', 10 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.trapping?.rank, 1))
      ]),
      multiplier('Invasive Species talent', 1 + getTalentBonus(talents, 'INVASIVE_SPECIES')
        * (getAtomBonus(account, 'Helium_-_Talent_Power_Stacker') + lavaLog(critters)) / 100),
      additiveGroup('Talent, card, star sign and more', [
        percent('Elusive Efficiency talent', getTalentBonus(talents, 'ELUSIVE_EFFICIENCY')),
        percent('Card', getSkillCardBonus(character, account, 'trapping', 'Trapping_Efficiency')),
        percent('Star sign', getStarSignBonus(character, account, 'Trap_Efficiency')),
        percent('Post office', getPostOfficeBonus(character?.postOffice, 'Trapping_Lockbox', 0)),
        percent('Pen Pals', getTrappingStuff('TrapMGbonus', 1, account) + getTrappingStuff('TrapMGbonus', 6, account))
      ])
    ])
  ];
  return { value: evaluateBreakdownNode(tree[0]) * evaluateBreakdownNode(tree[1]), tree };
}

// game: skillstats2("WorshipEfficiency"): 10 + base power * every multiplier
const getWorshipEffParts = (character: any, characters: any, account: any, playerInfo: any) => {
  const isWisdom = mainStatMap?.[character?.class] === 'wisdom';
  const talents = character?.flatTalents;
  const level = character?.skillsInfo?.worship?.level;
  const powerLines = getSkillPowerLines(character, account, {
    tool: TOOLS.SKULL,
    toolLabel: 'Skull (Le Brain Tools)',
    toolMultiplier: 1 + getBubbleBonus(account, 'LE_BRAIN_TOOLS', false, isWisdom) / 100,
    flatBase: 4,
    statueIndex: 16,
    slabBubble: 'SLABE_LOGSOUL',
    endgameBubble: 'ENDGAME_EFF_III',
    classBubbleMultiplier: isWisdom
  });
  const souls = calculateItemTotalAmount(account?.storage?.list, 'Soul1', true, true);
  const tree = [
    flat('Base', 10, { note: 'Every character starts at 10' }),
    sumGroup('Base power', [
      sumGroup('Worship power ^ 1.3', powerLines, { power: 1.3 }),
      flat('Wisdom', Math.pow(character?.stats?.wisdom + 1, 0.6) * (1 + getTalentBonus(talents, 'SKILL_WIZ') / 100)),
      flat('Stamp', getStampsBonusByStat(account, 'WorshipEff', character)),
      getAllBaseSkillEffBreakdown(character, account, characters, playerInfo)
    ]),
    productGroup('Multipliers', [
      multiplier('Worship level', 1 + level / 200),
      getAllEffBreakdown(character, characters, account),
      multiplier('Sooouls talent', 1 + getTalentBonus(talents, 'SOOOULS')
        * (getAtomBonus(account, 'Helium_-_Talent_Power_Stacker') + lavaLog(souls)) / 100),
      additiveGroup('Mastery, post office, right hand and star sign', [
        // game: 10 * getbonus2(1, 445) * RiftStuff("RiftSkillBonus,8", 1) - the talent only counts with the mastery
        percent('Smart Efficiency with skill mastery', 10 * getTalentBonus(talents, 'SMART_EFFICIENCY')
          * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.worship?.rank, 1)),
        percent('Post office', getPostOfficeBonus(character?.postOffice, 'Crate_of_the_Creator', 0)),
        percent('Right Hand of Action', getMaestroHand(character, 'worship', characters, account, 'RIGHT_HAND_OF_ACTION')),
        percent('Star sign', getStarSignBonus(character, account, 'Worship_Efficiency'))
      ])
    ])
  ];
  const value = evaluateBreakdownNode(tree[0]) + evaluateBreakdownNode(tree[1]) * evaluateBreakdownNode(tree[2]);
  return { value, tree };
}

const skillEfficiencyParts: Record<string, { statName: string, getParts: typeof getMiningEffParts }> = {
  mining: { statName: 'Mining Efficiency', getParts: getMiningEffParts },
  chopping: { statName: 'Choppin Efficiency', getParts: getChoppingEffParts },
  fishing: { statName: 'Fishing Efficiency', getParts: getFishingEffParts },
  catching: { statName: 'Catching Efficiency', getParts: getCatchingEffParts },
  trapping: { statName: 'Trapping Efficiency', getParts: getTrappingEffParts },
  worship: { statName: 'Worship Efficiency', getParts: getWorshipEffParts },
  // cooking.ts, lab.ts and spelunking.ts import this module, so their parts are looked up at call time
  cooking: { statName: 'Cooking Efficiency', getParts: (...args) => getCookingEffParts(...args) },
  laboratory: { statName: 'Lab Efficiency', getParts: (...args) => getLabEfficiencyParts(...args) },
  spelunking: { statName: 'Spelunking Efficiency', getParts: (character, characters, account) =>
      getSpelunkingEfficiencyParts(character, characters, account) }
};

// The efficiency tab of a skill's drawer; undefined for skills whose efficiency is not computed yet
export const getSkillEfficiency = (skillName: string, character: any, characters: any, account: any, playerInfo: any) => {
  const skill = skillEfficiencyParts[skillName];
  if (!skill) return undefined;
  const { value, tree } = skill.getParts(character, characters, account, playerInfo);
  const formattedValue = String(notateNumber(value));
  return { value, formattedValue, breakdown: createBreakdown(skill.statName, formattedValue, tree, 'Efficiency') };
}

const getMaestroRightHandBonus = (character: any, skillName: any, characters: any) => {
  const bestMaestro = characters?.filter((character: any) => checkCharClass(character?.class, CLASSES.Maestro))?.at(-1);
  const rightHandOfLearningTalentBonus = getTalentBonus(bestMaestro?.flatTalents, 'RIGHT_HAND_OF_ACTION', false, true);
  if (character?.skillsInfo?.[skillName]?.level < bestMaestro?.skillsInfo?.[skillName]?.level) {
    return rightHandOfLearningTalentBonus
  }
  return 0;
}