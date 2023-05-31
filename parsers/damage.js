import {
  checkCharClass,
  getHighestTalentByClass,
  getTalentBonus,
  getTalentBonusIfActive,
  mainStatMap
} from "./talents";
import { getPostOfficeBonus } from "./postoffice";
import { getDungeonFlurboStatBonus } from "./dungeons";
import { getCardBonusByEffect } from "./cards";
import { getGuildBonusBonus } from "./guild";
import { getBubbleBonus, getSigilBonus, getVialsBonusByStat } from "./alchemy";
import { getStatsFromGear } from "./items";
import { getObolsBonus } from "./obols";
import { getFamilyBonusBonus } from "./family";
import { bonuses, classFamilyBonuses, monsters, randomList } from "../data/website-data";
import {
  getFoodBonus,
  getGoldenFoodBonus,
  getHighestLevelOf,
  getMinigameScore,
  getSkillMasteryBonusByIndex,
  isArenaBonusActive
} from "./misc";
import { getStarSignBonus } from "./starSigns";
import { getArcadeBonus } from "./arcade";
import { getPlayerSpeedBonus } from "./character";
import { getStatueBonus } from "./statues";
import { calcStampCollected, getStampsBonusByEffect } from "./stamps";
import { lavaLog } from "../utility/helpers";
import { getShrineBonus } from "./shrines";
import { getPrayerBonusAndCurse } from "./prayers";
import { getJewelBonus, getLabBonus, getPlayerLabChipBonus } from "./lab";
import { getMealsBonusByEffectOrStat } from "./cooking";
import { getEclipseSkullsBonus } from "./deathNote";
import { isArtifactAcquired } from "./sailing";
import { getAtomBonus } from "./atomCollider";
import { getShinyBonus } from "./breeding";
import { isSuperbitUnlocked } from "./gaming";
import { constructionMasteryThresholds } from "./construction";
import { getSaltLickBonus } from "./saltLick";
import { getAchievementStatus } from "./achievements";
import { getGodBlessingBonus } from "./divinity";

export const getMaxDamage = (character, characters, account) => {
  const playerInfo = {};
  const mainStat = mainStatMap?.[character?.class];
  const strTalentBonus = getTalentBonus(character?.talents, 1, 'STRENGTH_IN_NUMBERS');
  const intTalentBonus = getTalentBonus(character?.talents, 1, 'KNOWLEDGE_IS_POWER');
  const lukTalentBonus = getTalentBonus(character?.talents, 1, 'LUCKY_HIT');
  const damageFromStat = character?.stats[mainStat] * (1 + (strTalentBonus + (intTalentBonus + lukTalentBonus)) / 100);

  playerInfo.maxHp = getMaxHp(character, characters, account);
  playerInfo.maxMp = getMaxMp(character, characters, account);
  playerInfo.movementSpeed = getPlayerSpeedBonus(character, characters, account);
  playerInfo.accuracy = getAccuracy(character, characters, account, playerInfo.movementSpeed);

  const mastery = getMastery(character, characters, account)

  const { baseDamage } = getBaseDamage(character, characters, account, playerInfo, damageFromStat)
  const hpMpDamage = getDamageFromHpMp(character, characters, account, playerInfo, damageFromStat);
  const perDamage = getDamageFromPerX(character, characters, account, playerInfo, hpMpDamage);
  const percentDamage = getDamagePercent(character, characters, account, playerInfo);
  playerInfo.maxDamage = baseDamage * perDamage * percentDamage;
  playerInfo.minDamage = mastery * playerInfo.maxDamage;

  //   console.log('dmg array', [baseDamage, perDamage, percentDamage])
  //   console.log('playerInfo', playerInfo);
  //   console.log('damage range', notateDamage(playerInfo));

  return playerInfo;
}

export const notateDamage = (playerInfo) => {
  const damageNotation = [];
  9999999 > playerInfo.maxDamage ?
    damageNotation.push(Math.ceil(playerInfo.minDamage)
      + ("~" + Math.ceil(playerInfo.maxDamage)))
    : 999999999 > playerInfo.maxDamage ?
      damageNotation.push(Math.ceil(playerInfo.minDamage / 1e3) / 1e3 + "[~" +
        Math.ceil(playerInfo.maxDamage / 1e3) / 1e3 + "[") : 9999999999999 > playerInfo.maxDamage ?
        damageNotation.push(Math.ceil(playerInfo.minDamage / 1e5) / 10 + "[~" + Math.ceil(playerInfo.maxDamage / 1e5) / 10 + "[")
        : damageNotation.push(Math.ceil(playerInfo.minDamage / 1e9) / 1e3 + "!~" + Math.ceil(playerInfo.maxDamage / 1e9) / 1e3 + "!");
  return damageNotation;
}

const getMastery = (character, characters, account) => {
  const mainStat = mainStatMap?.[character?.class];
  const talent113 = 0;
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'LIL_BIG_DAMAGE', false, mainStat === 'agility');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Minimum_Damage');
  const talentBonus = getTalentBonus(character?.talents, 2, 'MASTERY_UP');
  const equipmentBonus = getStatsFromGear(character, 21, account);

  return Math.min(.8, .35 - talent113
    / 100 + (bubbleBonus
      + (cardBonus + (talentBonus + (equipmentBonus)))) / 100);
}
const getDamagePercent = (character, characters, account) => {
  const mainStat = mainStatMap?.[character?.class];
  const { strength, agility, wisdom, luck } = character?.stats;
  const wormHoleTalent = getTalentBonus(character?.talents, 3, 'WORMHOLE_EMPEROR');
  const perWormholeKills = 1 + (wormHoleTalent * lavaLog(account?.accountOptions?.[152])) / 100;
  const eclipseSkulls = getEclipseSkullsBonus(account) * 5;
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'NO_PAIN_NO_GAIN');
  const starSignBonus = getStarSignBonus(character, account, 'Total_Damage');
  const unlockedGods = account?.divinity?.unlockedDeities;
  const godTalent = getHighestTalentByClass(characters, 3, 'Elemental_Sorcerer', 'GODS_CHOSEN_CHILDREN', false, true);
  const orbTalent = getHighestTalentByClass(characters, 3, 'Voidwalker', 'POWER_ORB');
  const shrineBonus = getShrineBonus(account?.shrines, 0, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Deaths_Storage_Unit', 2);
  const secondPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Scurvy_C\'arr\'ate', 2);
  const thirdPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Gaming_Lootcrate', 2);

  const highestLevelBb = getHighestLevelOf(characters, 'Blood_Berserker')
  const theFamilyGuy = getTalentBonus(character?.talents, 3, 'THE_FAMILY_GUY')
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_DAMAGE', highestLevelBb);
  const amplifiedFamilyBonus = familyBonus * (character?.class === 'Blood_Berserker' && theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1)
  const firstArtifact = isArtifactAcquired(account?.sailing?.artifacts, 'Crystal_Steak');
  const artifactBonus = firstArtifact?.additionalData?.[character?.playerId]?.bonus ?? 0;
  const secondArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Ruble_Cuble')?.bonus ?? 0;
  const thirdArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Fun_Hippoete')?.bonus ?? 0;
  const fourthArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Opera_Mask')?.bonus ?? 0;
  const fifthArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'The_True_Lantern')?.bonus ?? 0;

  const atomBonus = getAtomBonus(account, 'Carbon_-_Wizard_Maximizer') ?? 0;
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Total_Damage');
  const superbitBonus = isSuperbitUnlocked(account, 'MSA_Skill_EXP')?.bonus ?? 0;
  const skillMasteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 0);

  const strPercBubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'power', 'BRITTLEY_SPEARS', false, mainStat === 'strength')
  const agiPercBubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'BOW_JACK', false, mainStat === 'agility')
  const wisPercBubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'MATTY_STAFFORD', false, mainStat === 'wisdom')

  const strBubbleBonus = mainStat === 'strength' || mainStat === 'luck' ? getBubbleBonus(account?.alchemy?.bubbles, 'power', 'POWER_TRIONE', false, mainStat === 'strength') : 0;
  const agiBubbleBonus = mainStat === 'agility' ? getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'POWER_TRITWO', false, mainStat === 'agility') : 0;
  const wisBubbleBonus = mainStat === 'wisdom' ? getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'POWER_TRITHREE', false, mainStat === 'wisdom') : 0;

  const constructMastery = account?.towers?.totalLevels >= constructionMasteryThresholds?.[2] ? 2 * Math.floor((account?.towers?.totalLevels - constructionMasteryThresholds?.[2]) / 10) : 0;

  const talentBonus = getTalentBonus(character?.talents, 0, 'GILDED_SWORD');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 9);
  const equipmentBonus = getStatsFromGear(character, 45, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[45]);

  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Beefy_For_Real', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Precision', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Fibers_of_Absence', account)?.curse;

  const labBonus = getLabBonus(account?.lab?.labBonuses, 0);
  const secondLabBonus = getLabBonus(account?.lab?.labBonuses, 11);
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const allOrangeActive = account?.lab.jewels?.slice(7, 10)?.every(({ active }) => active) ? 2 : 1;
  const jewelBonus = getJewelBonus(account?.lab.jewels, 10, spelunkerObolMulti) * allOrangeActive;

  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet26' ? character?.cards?.cardSet?.bonus : 0;
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Damage');

  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const arenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 2));
  const secondArenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 15));

  const chipBonus = getPlayerLabChipBonus(character, account, 12);
  const blackDiamondRhinestone = getJewelBonus(account?.lab.jewels, 16, spelunkerObolMulti);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, "TotDmg", blackDiamondRhinestone);
  const curseTalent = getTalentBonus(character?.talents, 1, 'CURSE_OF_MR_LOOTY_BOOTY');
  const activeDebuff = getTalentBonusIfActive(character?.activeBuffs, 'BALANCED_SPIRIT');
  const godBlessing = getGodBlessingBonus(account?.divinity?.deities, 'Flutterbis')
  const secondGodBlessing = getGodBlessingBonus(account?.divinity?.deities, 'Kattlecruk')

  const damage = perWormholeKills
    * (1 + eclipseSkulls / 100)
    * (1 + (activeBuff
      + (starSignBonus
        + (Math.max(0, unlockedGods - 10)
          * godTalent
          + Math.floor(Math.max(0, character?.level - 200) / 50)
          * orbTalent))) / 100) * (1 + (shrineBonus
      + (postOfficeBonus
        + (secondPostOfficeBonus
          + thirdPostOfficeBonus)
        + amplifiedFamilyBonus)
      + (artifactBonus
        + (atomBonus
          + (shinyBonus
            + superbitBonus)))) / 100)
    * (1 + (skillMasteryBonus
      + strPercBubbleBonus
      + (agiPercBubbleBonus
        + (wisPercBubbleBonus
          + (secondArtifactBonus
            + (thirdArtifactBonus
              + (strBubbleBonus
                * Math.floor(Math.max(strength, luck) / 250)
                + agiBubbleBonus
                * Math.floor(agility / 250)
                + (wisBubbleBonus
                  * Math.floor(wisdom / 250)
                  + constructMastery))))))) / 100)
    * (1 + (talentBonus + (saltLickBonus
        + (equipmentBonus + obolsBonus + prayerBonus))
      + (labBonus + (secondLabBonus
        + jewelBonus) + (fourthArtifactBonus
        + fifthArtifactBonus))) / 100)
    * (1 + (cardBonus + cardSetBonus) / 100)
    * (1 + (20 * arenaBonusUnlock
      + 40 * secondArenaBonusUnlock + (chipBonus
        + mealBonus) + 2 * getAchievementStatus(account?.achievements, 58)
      + 3 * getAchievementStatus(account?.achievements, 59) + (5 * getAchievementStatus(account?.achievements, 60)
        + 5 * getAchievementStatus(account?.achievements, 62)) + 2 * getAchievementStatus(account?.achievements, 119)
      + 3 * getAchievementStatus(account?.achievements, 120) + (5 * getAchievementStatus(account?.achievements, 121)
        + 2 * getAchievementStatus(account?.achievements, 185) + 3 * getAchievementStatus(account?.achievements, 186)
        + (5 * getAchievementStatus(account?.achievements, 187) + (getAchievementStatus(account?.achievements, 240)
            + getAchievementStatus(account?.achievements, 280)) + 3 * getAchievementStatus(account?.achievements, 297)
          + 2 * getAchievementStatus(account?.achievements, 303) + (godBlessing
            + secondGodBlessing)))) / 100)
    * Math.max((1 - curseTalent / 100)
      * (1 - activeDebuff / 100)
      * Math.max(.01, 1 - (prayerCurse + secondPrayerCurse) / 100), .05);
  return 100 < damage ? 100 + Math.max(Math.pow(damage - 100, .86), 0) : damage;
}
const getDamageFromPerX = (character, characters, account, playerInfo, hpMpDamage) => {
  const dmgPerSmithing = getTalentBonus(character?.talents, 1, 'VEINS_OF_THE_INFERNAL');
  const choppingScore = getMinigameScore(account, 'chopping');

  const dmgPerMinigame = getTalentBonus(character?.talents, 1, 'CHOPPIN_IT_UP_EZ', true);
  const dmgPerMinigameBonus = dmgPerMinigame * Math.floor(choppingScore / 25)
  const dmgPerLowestSkill = getTalentBonus(character?.talents, 2, 'SKILLAGE_DAMAGE');
  const lowestSkill = Math.min(...(Object.entries(character?.skillsInfo)?.filter(([_, { index }]) => index < 9)
    ?.map(([_, { level }]) => level) || [])) ?? 0;
  const lowestSkillBonus = dmgPerLowestSkill * Math.floor(lowestSkill / 5);
  const dmgPerApoc = getTalentBonus(character?.talents, 2, 'APOCALYPSE_ZOW');
  const zows = character?.zow?.finished?.[0] + 1 || 0;
  const dmgPerApocBonus = dmgPerApoc * zows;

  const monster = monsters?.[character?.targetMonster];
  const dmgPerRefinery = getTalentBonus(character?.talents, 2, 'PRECISION_POWER');
  const dmgPerRefineryBonus = playerInfo.accuracy >= monster?.Defence * 2.25 ? account?.refinery?.totalLevels * dmgPerRefinery : 0;

  const greenVials = account?.alchemy?.vials?.reduce((sum, { level }) => sum + (level > 3 ? 1 : 0), 0);
  const dmgPerVial = getTalentBonus(character?.talents, 2, 'VIRILE_VIALS');
  const dmgPerVialBonus = dmgPerVial * greenVials;

  const items = account?.looty?.lootedItems;
  const dmgPerItems = getTalentBonus(character?.talents, 2, 'LOOTY_MC_SHOOTY');
  const dmgPerItemsBonus = dmgPerItems * items / 50;

  const stampsCollected = calcStampCollected(account?.stamps);
  const dmgPerStamps = getTalentBonus(character?.talents, 2, 'PAPERWORK,_GREAT...');
  const dmgPerStampsBonus = dmgPerStamps * stampsCollected / 10;

  const dmgPerSpeed = getTalentBonus(character?.talents, 2, 'SPEEDNA');
  const dmgPerSpeedBonus = dmgPerSpeed * Math.floor((playerInfo.movementSpeed / 100 - 1) / .15)

  const dmgPerDungeonCredits = getTalentBonus(character?.starTalents, null, 'DUNGEONIC_DAMAGE')
  const dmgPerDungeonCreditsBonus = dmgPerDungeonCredits * lavaLog(account?.accountOptions?.[71]);

  const minorBonus = character?.linkedDeity === 2 ? character?.deityMinorBonus : character?.secondLinkedDeityIndex === 2 ? character?.secondDeityMinorBonus : 0;

  const secondGoldenFoodBonus = getGoldenFoodBonus('Golden_Kebabs', character, account) || 1;

  const damage = hpMpDamage * (1 + dmgPerSmithing
      * (character?.skillsInfo?.smithing?.level / 12) / 100)
    * (1 + (dmgPerMinigameBonus +
      (lowestSkillBonus
        + dmgPerApocBonus
        + dmgPerRefineryBonus
        + dmgPerVialBonus
        + (dmgPerItemsBonus
          + dmgPerStampsBonus)
        + dmgPerSpeedBonus
        + dmgPerDungeonCreditsBonus
        + minorBonus)) / 100)
    * (secondGoldenFoodBonus === 1 ? secondGoldenFoodBonus : 1 + secondGoldenFoodBonus / 100);
  return 100 < damage ? 100 + Math.max(Math.pow(damage - 100, .86), 0) : damage;
}
const getDamageFromHpMp = (character, characters, account, playerInfo, damageFromStat) => {
  const secondStatueBonus = getStatueBonus(account?.statues, 'StatueG23', character?.talents);
  const talent113 = 0;
  const hpTalentBonus = getTalentBonus(character?.talents, 0, 'MEAT_SHANK');
  const mpTalentBonus = getTalentBonus(character?.talents, 0, 'OVERCLOCKED_ENERGY');
  const bribeBonus = account?.bribes?.[20]?.done ? account?.bribes?.[20]?.value : 0;
  const stampBonus = getStampsBonusByEffect(account?.stamps, "Total_Damage");

  return 1 +
    (Math.pow(damageFromStat, .7)
      + (bribeBonus + (stampBonus
          + secondStatueBonus
          + talent113)
        + (lavaLog(playerInfo.maxHp) * hpTalentBonus
          + lavaLog(playerInfo.maxMp) * mpTalentBonus))) / 100;
}
const getBaseDamage = (character, characters, account, playerInfo, damageFromStat) => {
  const mainStat = mainStatMap?.[character?.class];
  const strWpTalent = getTalentBonus(character?.talents, 1, 'CARRY_A_BIG_STICK');
  const agiWpTalent = getTalentBonus(character?.talents, 1, 'HIGH_POLYMER_LIMBS');
  const intWpTalent = getTalentBonus(character?.talents, 1, 'POWER_OVERWHELMING');

  const baseWp = getTalentBonus(character?.talents, 0, 'SHARPENED_AXE');
  const weaponPower = getWeaponPower(character, characters, account);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Base_Damage')?.bonus ?? 0;
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Nomwich', character, account);

  const stampsBonus = getStampsBonusByEffect(account?.stamps, "Base_Damage")
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Civil_War_Memory_Box', 0);
  const equipmentBonus = getStatsFromGear(character, 16, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[16]);
  const statueBonus = getStatueBonus(account?.statues, 'StatueG1', character?.talents);
  const hpBubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'power', 'BIG_MEATY_CLAWS', false, mainStat === 'strength'); // above 250 HP
  const speedBubble = getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'QUICK_SLAP', false, mainStat === 'agility'); // works above 110% speed
  const mpBubble = getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'NAME_I_GUESS', false, mainStat === 'wisdom'); // 150 MP
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_Damage');
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'PLUNGING_SWORD');
  const weaponPowerEffect = Math.pow((weaponPower * (1 + (strWpTalent + (agiWpTalent + intWpTalent)) / 100) + baseWp) / 3, 2) + (damageFromStat + goldenFoodBonus) + arcadeBonus;

  let damage = weaponPowerEffect
    + (stampsBonus + (equipmentBonus + obolsBonus)
      + statueBonus
      + (postOfficeBonus
        + (hpBubbleBonus
          * lavaLog(Math.max(playerInfo.maxHp - 250, 1))
          + speedBubble
          * (Math.max((playerInfo.movementSpeed / 100) - 1.1, 0) / .25)
          + (mpBubble
            * lavaLog(Math.max(playerInfo.maxMp - 150, 1))
            + (cardBonus + sigilBonus)))));
  if (damage > 4e3) {
    damage = 4e3 + Math.max(Math.pow(damage - 4e3, .91), 0);
  }
  if (damage > 15e3) {
    damage = 15e3 + Math.max(Math.pow(damage - 15e3, .84));
  }

  const foodBonus = getFoodBonus(character, account, "BaseDmgBoosts");
  damage += foodBonus;
  return { baseDamage: damage };
}
const getAccuracy = (character, characters, account, movementSpeed) => {
  // _customBlock_PlayerAccTot = function
  const accuracyStats = {
    'strength': 'wisdom',
    'agility': 'strength',
    'wisdom': 'agility',
    'luck': 'luck'
  }
  const mainStat = mainStatMap?.[character?.class];
  const accuracyStat = accuracyStats?.[mainStat];

  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'baseACC');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Box_of_Unwanted_Stats', 0);
  const baseCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_accuracy');
  const equipmentBonus = getStatsFromGear(character, 28, account);
  const goldenFoodBonus = getGoldenFoodBonus('Butter_Bar', character, account) || 0;
  const stampBonus = getStampsBonusByEffect(account?.stamps, "Base_Accuracy");

  const baseAccuracy = 2 + vialBonus
    + (postOfficeBonus
      + (baseCardBonus
        + equipmentBonus
        + goldenFoodBonus)
      + stampBonus);

  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'SHAQURACY', false, mainStat === 'agility');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Accuracy');
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet4' ? character?.cards?.cardSet?.bonus : 0;
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'EXTENDO_RANGEO');
  const secondActiveBuff = getTalentBonusIfActive(character?.activeBuffs, 'BALANCED_SPIRIT');
  const starSignBonus = getStarSignBonus(character, account, 'Accuracy');
  const statueBonus = getStatueBonus(account?.statues, 'StatueG15', character?.talents);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Total_Accuracy')?.bonus;
  const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Accuracy');
  const bribeBonus = account?.bribes?.[21]?.done ? account?.bribes?.[21]?.value : 0;
  const tipToeQuickness = getTalentBonus(character?.starTalents, null, 'TIPTOE_QUICKNESS', true);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Precision', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Beefy_For_Real', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Pain', account)?.curse;
  const chipBonus = getPlayerLabChipBonus(character, account, 2);

  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab.jewels, 16, spelunkerObolMulti);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, "TotAcc", blackDiamondRhinestone);
  const minorBonus = character?.linkedDeity === 0 ? character?.deityMinorBonus : 0;

  let accuracy = character?.stats?.[accuracyStat]
    * (1 + bubbleBonus / 100) *
    (1 + (activeBuff + (cardBonus
      + (starSignBonus
        + (secondActiveBuff + (statueBonus
          + (arcadeBonus + (flurboBonus + bribeBonus))))))) / 100);
  if ((movementSpeed / 100) > 1.99) {
    accuracy *= (1 + tipToeQuickness / 100);
  }
  accuracy = (Math.pow(accuracy / 4, 1.4)
      + (accuracy + baseAccuracy))
    * (1 + (accuracy + 2 * cardSetBonus) / 200)
    * Math.max(0.1, 1 + (prayerBonus - prayerCurse - secondPrayerCurse) / 100)
    * (1 + (chipBonus + mealBonus) / 100) * (1 + minorBonus / 100)
  return accuracy;
}
const getMaxMp = (character, characters, account) => {
  // customBlock_PlayerMPmax
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_MP');
  const cardPercentBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_MP');
  const mpBubble = 0;
  const stampBonus = getStampsBonusByEffect(account?.stamps, "Base_MP");
  const mpTalentBonus = getTalentBonus(character?.talents, 0, 'MANA_BOOSTER');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Magician_Starterpack', 0);
  const postOfficePercentBonus = getPostOfficeBonus(character?.postOffice, 'Magician_Starterpack', 1);
  const maxHpTalentBonus = getTalentBonus(character?.talents, 1, 'MANA_OVERDRIVE');
  const agiMaxHpTalentBonus = getTalentBonus(character?.talents, 1, 'HEMA_OVERDRIVE');

  const baseMp = 10 + cardBonus
    + mpBubble + stampBonus
    + (mpTalentBonus + (character?.stats?.wisdom + postOfficeBonus));

  const percentageMp = (1
    + (maxHpTalentBonus + agiMaxHpTalentBonus) / 100) * (1 + (postOfficePercentBonus
    + cardPercentBonus) / 100);

  return baseMp * percentageMp;
}
const getMaxHp = (character, characters, account) => {
  // customBlock_PlayerHPmax
  const foodBonus = getFoodBonus(character, account, "HpBaseBoosts");
  const statueBonus = getStatueBonus(account?.statues, 'StatueG5', character?.talents);

  const baseHp = foodBonus + statueBonus;

  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_HP');
  const cardPercentBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_HP');
  const hpBubble = 0;
  const stampBonus = getStampsBonusByEffect(account?.stamps, "Base_HP");
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Locally_Sourced_Organs', 0);
  const postOfficePercentBonus = getPostOfficeBonus(character?.postOffice, 'Locally_Sourced_Organs', 1);
  const hpTalentBonus = getTalentBonus(character?.talents, 0, 'HEALTH_BOOSTER');
  const hpStarTalentBonus = getTalentBonus(character?.starTalents, null, 'UBERCHARGED_HEALTH');
  const hpPercentTalentBonus = getTalentBonus(character?.talents, 1, 'STRENGTH_IN_NUMBERS');
  const maxHpTalentBonus = getTalentBonus(character?.talents, 1, 'HEALTH_OVERDRIVE');
  const agiMaxHpTalentBonus = getTalentBonus(character?.talents, 1, 'HEMA_OVERDRIVE');
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'NO_PAIN_NO_GAIN');
  const starSignBonus = getStarSignBonus(character, account, 'Total_HP');

  const highestLevelSquire = getHighestLevelOf(characters, 'Squire')
  const theFamilyGuy = getTalentBonus(character?.talents, 3, 'THE_FAMILY_GUY')
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_HP', highestLevelSquire);
  const amplifiedFamilyBonus = familyBonus * (checkCharClass(character?.class, 'Squire') && character?.level === highestLevelSquire && theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1)

  const equipmentBonus = getStatsFromGear(character, 15, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[15]);
  const shrineBonus = getShrineBonus(account?.shrines, 1, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Jam', character, account) || 1;

  const flatHp = 15 + cardBonus
    + hpBubble + (stampBonus
      + baseHp)
    + (postOfficeBonus
      + (hpTalentBonus + hpStarTalentBonus) + Math.pow(character?.stats?.strength
        * (1 + hpPercentTalentBonus / 100), 1.05));

  const percentageHp = (1 + (maxHpTalentBonus
      + (agiMaxHpTalentBonus
        + equipmentBonus + obolsBonus)) / 100)
    * (1 + shrineBonus / 100)
    * (goldenFoodBonus === 1 ? goldenFoodBonus : 1 + goldenFoodBonus / 100)
    * (1 + postOfficePercentBonus / 100)
    * (1 - activeBuff / 100)
    * (1 + (amplifiedFamilyBonus
      + cardPercentBonus) / 100)
    * (1 + starSignBonus / 100)

  return flatHp * percentageHp;
}
const getWeaponPower = (character, characters, account) => {
  // "Weapon_Power" ==
  const mainStat = mainStatMap?.[character?.class];
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Deaths_Storage_Unit', 0);
  const flurbo = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Weapon_Power');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Weapon_Power');
  const cardPassiveBonus = getCardBonusByEffect(account?.cards, 'Weapon_Power_(Passive)')
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses?.bonuses, 3);
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'DUSTER_STUDS');
  const equipmentBonus = getStatsFromGear(character, 'Weapon_Power', account);
  const obols = getObolsBonus(character?.obols, 'Weapon_Power');
  const chipBonus = getPlayerLabChipBonus(character, account, 19);
  const strBubbleBonus = mainStat === 'strength' ? getBubbleBonus(account?.alchemy?.bubbles, 'power', 'SPEAR_POWAH', false, mainStat === 'strength') : 0;
  const agiBubbleBonus = mainStat === 'agility' ? getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'BOW_POWER', false, mainStat === 'agility') : 0;
  const intBubbleBonus = mainStat === 'wisdom' || mainStat === 'luck' ? getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'WAND_PAWUR', false, mainStat === 'wisdom') : 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'WeaponPOW');
  const highestLevelBarbarian = getHighestLevelOf(characters, 'Barbarian')
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'WEAPON_POWER', highestLevelBarbarian);
  const starSignBonus = getStarSignBonus(character, account, 'Weapon_Power');
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Weapon_Power')?.bonus;
  const wpPerCookingTalentBonus = getTalentBonus(character?.talents, 3, 'TOUGH_STEAKS');
  const wpPerGamingTalentBonus = getTalentBonus(character?.talents, 3, 'GAMER_STRENGTH');
  const wpPerSailingTalentBonus = Math.round(getTalentBonus(character?.talents, 3, 'CREW_ROWING_STRENGTH') * 10) / 10;
  const wpPerDivinityTalentBonus = getTalentBonus(character?.talents, 3, 'BELIEVER_STRENGTH');
  const wpPerPetTalentBonus = getTalentBonus(character?.talents, 3, 'ANIMALISTIC_FEROCITY');
  const wpPerLabTalentBonus = getTalentBonus(character?.talents, 3, 'WIRED_IN_POWER');

  const firstStoredPet = account?.breeding?.storedPets?.[0]?.power ?? 0;
  const highestBeginner = getHighestLevelOf(characters, 'Beginner');
  const beginnerBonus = getTalentBonus(character?.starTalents, null, 'BEGINNER_BEST_CLASS');
  const bestBeginnerBonus = Math.min(beginnerBonus, Math.floor(highestBeginner / 10));
  const wpFromFood = getFoodBonus(character, account, "WeaponPowerBoosts");

  return 5 + postOfficeBonus
    + flurbo + wpFromFood
    + (cardBonus + cardPassiveBonus
      + (guildBonus + sigilBonus))
    + ((equipmentBonus + obols) *
      (1 + (chipBonus + (strBubbleBonus
        + (agiBubbleBonus + intBubbleBonus))) / 100)
      + bestBeginnerBonus + (vialBonus + (familyBonus
        + (starSignBonus + (arcadeBonus + (wpPerCookingTalentBonus
          * Math.floor(character?.skillsInfo?.cooking?.level / 10) + (wpPerGamingTalentBonus * Math.floor(character?.skillsInfo?.gaming?.level / 10) +
            (wpPerSailingTalentBonus * Math.floor(character?.skillsInfo?.sailing?.level / 10) + wpPerDivinityTalentBonus
              * Math.floor(character?.skillsInfo?.divinity?.level / 10))) + (wpPerPetTalentBonus * lavaLog(firstStoredPet) +
            wpPerLabTalentBonus * Math.floor(character?.skillsInfo?.laboratory?.level / 10))))))));
}

