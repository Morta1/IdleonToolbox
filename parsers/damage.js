import {
  checkCharClass,
  CLASSES,
  getHighestTalentByClass,
  getTalentBonus,
  getTalentBonusIfActive,
  mainStatMap
} from './talents';
import { getPostOfficeBonus } from './postoffice';
import { getDungeonFlurboStatBonus } from './dungeons';
import { getCardBonusByEffect } from './cards';
import { getGuildBonusBonus } from './guild';
import { getActiveBubbleBonus, getBubbleBonus, getSigilBonus, getVialsBonusByStat } from './alchemy';
import { getStatsFromGear } from './items';
import { getObolsBonus } from './obols';
import { getFamilyBonusBonus } from './family';
import { bonuses, classFamilyBonuses, mapDetails, monsters, randomList } from '../data/website-data';
import {
  getFoodBonus,
  getGoldenFoodBonus,
  getHealthFoodBonus,
  getHighestLevelOf,
  getMinigameScore,
  getSkillMasteryBonusByIndex,
  isArenaBonusActive,
  isCompanionBonusActive
} from './misc';
import { getStarSignBonus } from './starSigns';
import { getArcadeBonus } from './arcade';
import { getAfkGain, getPlayerSpeedBonus, getRespawnRate } from './character';
import { getStatueBonus } from './statues';
import { calcStampCollected, getStampsBonusByEffect } from './stamps';
import { lavaLog } from '../utility/helpers';
import { getShrineBonus } from './shrines';
import { getPrayerBonusAndCurse } from './prayers';
import { getJewelBonus, getLabBonus, getPlayerLabChipBonus } from './lab';
import { getMealsBonusByEffectOrStat } from './cooking';
import { getEclipseSkullsBonus } from './deathNote';
import { isArtifactAcquired } from './sailing';
import { getAtomBonus } from './atomCollider';
import { getShinyBonus } from './breeding';
import { isSuperbitUnlocked } from './gaming';
import { constructionMasteryThresholds } from './construction';
import { getSaltLickBonus } from './saltLick';
import { getAchievementStatus } from './achievements';
import { getGodBlessingBonus, getMinorDivinityBonus } from './divinity';
import { getEquinoxBonus } from './equinox';
import { getMiningEff } from '@parsers/efficiency';

export const getMaxDamage = (character, characters, account) => {
  const playerInfo = { survivabilityMath: 0 };
  const mainStat = mainStatMap?.[character?.class];
  const strTalentBonus = getTalentBonus(character?.flatTalents, 'STRENGTH_IN_NUMBERS');
  const intTalentBonus = getTalentBonus(character?.flatTalents, 'KNOWLEDGE_IS_POWER');
  const lukTalentBonus = getTalentBonus(character?.flatTalents, 'LUCKY_HIT');
  const damageFromStat = (character?.stats?.[mainStat] || 0) * (1 + (strTalentBonus + (intTalentBonus + lukTalentBonus)) / 100);

  const { respawnRate } = getRespawnRate(character, account);
  playerInfo.respawnRate = respawnRate;
  const { afkGains } = getAfkGain(character, characters, account);
  playerInfo.afkGains = afkGains;
  playerInfo.maxHp = getMaxHp(character, characters, account);
  playerInfo.maxMp = getMaxMp(character, characters, account);
  playerInfo.movementSpeed = getPlayerSpeedBonus(character, characters, account);
  playerInfo.accuracy = getAccuracy(character, characters, account, playerInfo.movementSpeed);
  playerInfo.critDamage = getCritDamage(character, characters, account);
  playerInfo.critChance = getCritChance(character, characters, account, playerInfo);
  playerInfo.hitChance = getHitChance(character, characters, account, playerInfo);
  playerInfo.mastery = getMastery(character, characters, account);

  // efficiencies
  playerInfo.miningEff = getMiningEff(character, characters, account, playerInfo);

  const { baseDamage } = getBaseDamage(character, characters, account, playerInfo, damageFromStat)
  const hpMpDamage = getDamageFromHpMp(character, characters, account, playerInfo, damageFromStat);
  const perDamage = getDamageFromPerX(character, characters, account, playerInfo, hpMpDamage);
  const percentDamage = getDamagePercent(character, characters, account, playerInfo);
  playerInfo.maxDamage = baseDamage * perDamage * percentDamage;
  playerInfo.minDamage = playerInfo.mastery * playerInfo.maxDamage;
  playerInfo.defence = getPlayerDefence(character, characters, account, playerInfo);
  playerInfo.survivability = getSurvivability(character, characters, account, playerInfo);
  playerInfo.killsPerHour = getKillsPerHour(character, characters, account, playerInfo);
  playerInfo.survivabilityMath = playerInfo.killsPerHour * playerInfo.afkGains * (playerInfo.survivability / 100);
  playerInfo.survivability = getSurvivability(character, characters, account, playerInfo);
  playerInfo.killsPerHour = getKillsPerHour(character, characters, account, playerInfo);

  playerInfo.killPerkill = getKillPerKill(character, characters, account, playerInfo);

  playerInfo.finalKillsPerHour = Math.floor(playerInfo.killsPerHour * playerInfo.afkGains * (playerInfo.survivability / 100) * playerInfo.killPerkill);

  return playerInfo;
}

export const notateDamage = (playerInfo) => {
  const damageNotation = [];
  9999999 > playerInfo.maxDamage ?
    damageNotation.push(Math.ceil(playerInfo.minDamage)
      + ('~' + Math.ceil(playerInfo.maxDamage)))
    : 999999999 > playerInfo.maxDamage ?
      damageNotation.push(Math.ceil(playerInfo.minDamage / 1e3) / 1e3 + '[~' +
        Math.ceil(playerInfo.maxDamage / 1e3) / 1e3 + '[') : 9999999999999 > playerInfo.maxDamage ?
        damageNotation.push(Math.ceil(playerInfo.minDamage / 1e5) / 10 + '[~' + Math.ceil(playerInfo.maxDamage / 1e5) / 10 + '[')
        : damageNotation.push(Math.ceil(playerInfo.minDamage / 1e9) / 1e3 + '!~' + Math.ceil(playerInfo.maxDamage / 1e9) / 1e3 + '!');
  return damageNotation;
}

const getMastery = (character, characters, account) => {
  const mainStat = mainStatMap?.[character?.class];
  const talent113 = 0;
  const bubbleBonus = getBubbleBonus(account, 'LIL_BIG_DAMAGE', false, mainStat === 'agility');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Minimum_Damage');
  const talentBonus = getTalentBonus(character?.flatTalents, 'MASTERY_UP');
  const equipmentBonus = getStatsFromGear(character, 21, account);

  return Math.min(.8, .35 - talent113
    / 100 + (bubbleBonus
      + (cardBonus + (talentBonus + (equipmentBonus)))) / 100);
}
const getDamagePercent = (character, characters, account) => {
  const mainStat = mainStatMap?.[character?.class];
  const { strength, agility, wisdom, luck } = character?.stats || {};
  const wormHoleTalent = getTalentBonus(character?.flatTalents, 'WORMHOLE_EMPEROR');
  const perWormholeKills = 1 + (wormHoleTalent * lavaLog(account?.accountOptions?.[152] ?? 0)) / 100;
  const equinoxDamageBonus = getEquinoxBonus(account?.equinox?.upgrades, 'Matching_Scims');
  const eclipseSkulls = getEclipseSkullsBonus(account) * 5;
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'NO_PAIN_NO_GAIN');
  const starSignBonus = getStarSignBonus(character, account, 'Total_Damage');
  const unlockedGods = account?.divinity?.unlockedDeities ?? 0;
  const godTalent = getHighestTalentByClass(characters, CLASSES.Elemental_Sorcerer, 'GODS_CHOSEN_CHILDREN', false, true);
  const orbTalent = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'POWER_ORB');
  const shrineBonus = getShrineBonus(account?.shrines, 0, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Deaths_Storage_Unit', 2);
  const secondPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Scurvy_C\'arr\'ate', 2);
  const thirdPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Gaming_Lootcrate', 2);

  const highestLevelBb = getHighestLevelOf(characters, CLASSES.Blood_Berserker)
  const theFamilyGuy = getTalentBonus(character?.flatTalents, 'THE_FAMILY_GUY')
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_DAMAGE', highestLevelBb);
  const amplifiedFamilyBonus = familyBonus * (checkCharClass(character?.class, CLASSES.Blood_Berserker) && theFamilyGuy > 0
    ? (1 + theFamilyGuy / 100)
    : 1)
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

  const strPercBubbleBonus = getBubbleBonus(account, 'BRITTLEY_SPEARS', false, mainStat === 'strength')
  const agiPercBubbleBonus = getBubbleBonus(account, 'BOW_JACK', false, mainStat === 'agility')
  const wisPercBubbleBonus = getBubbleBonus(account, 'MATTY_STAFFORD', false, mainStat === 'wisdom')

  const strBubbleBonus = mainStat === 'strength' || mainStat === 'luck'
    ? getBubbleBonus(account, 'POWER_TRIONE', false, mainStat === 'strength')
    : 0;
  const agiBubbleBonus = mainStat === 'agility'
    ? getBubbleBonus(account, 'POWER_TRITWO', false, mainStat === 'agility')
    : 0;
  const wisBubbleBonus = mainStat === 'wisdom'
    ? getBubbleBonus(account, 'POWER_TRITHREE', false, mainStat === 'wisdom')
    : 0;

  const constructMastery = account?.towers?.totalLevels >= constructionMasteryThresholds?.[2]
    ? 2 * Math.floor((account?.towers?.totalLevels - constructionMasteryThresholds?.[2]) / 10)
    : 0;

  const talentBonus = getTalentBonus(character?.flatTalents, 'GILDED_SWORD');
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
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'TotDmg');
  const curseTalent = getTalentBonus(character?.flatTalents, 'CURSE_OF_MR_LOOTY_BOOTY');
  const activeDebuff = getTalentBonusIfActive(character?.activeBuffs, 'BALANCED_SPIRIT');
  const godBlessing = getGodBlessingBonus(account?.divinity?.deities, 'Flutterbis')
  const secondGodBlessing = getGodBlessingBonus(account?.divinity?.deities, 'Kattlecruk')

  const damage = perWormholeKills
    * (1 + equinoxDamageBonus / 100)
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
  const dmgPerSmithing = getTalentBonus(character?.flatTalents, 'VEINS_OF_THE_INFERNAL');
  const choppingScore = getMinigameScore(account, 'chopping');

  const dmgPerMinigame = getTalentBonus(character?.flatTalents, 'CHOPPIN_IT_UP_EZ', true);
  const dmgPerMinigameBonus = dmgPerMinigame * Math.floor(choppingScore / 25)
  const dmgPerLowestSkill = getTalentBonus(character?.flatTalents, 'SKILLAGE_DAMAGE');
  const lowestSkill = Math.min(...(Object.entries(character?.skillsInfo || {})?.filter(([_, { index }]) => index < 9)
    ?.map(([_, { level }]) => level) || [])) ?? 0;
  const lowestSkillBonus = dmgPerLowestSkill * Math.floor(lowestSkill / 5);
  const dmgPerApoc = getTalentBonus(character?.flatTalents, 'APOCALYPSE_ZOW');
  const zows = character?.zow?.finished?.[0] + 1 || 0;
  const dmgPerApocBonus = dmgPerApoc * zows;

  const monster = monsters?.[character?.targetMonster];
  const dmgPerRefinery = getTalentBonus(character?.flatTalents, 'PRECISION_POWER');
  const dmgPerRefineryBonus = playerInfo.accuracy >= monster?.Defence * 2.25
    ? account?.refinery?.totalLevels * dmgPerRefinery
    : 0;

  const greenVials = account?.alchemy?.vials?.reduce((sum, { level }) => sum + (level > 3 ? 1 : 0), 0);
  const dmgPerVial = getTalentBonus(character?.flatTalents, 'VIRILE_VIALS');
  const dmgPerVialBonus = dmgPerVial * greenVials;

  const items = account?.looty?.lootedItems;
  const dmgPerItems = getTalentBonus(character?.flatTalents, 'LOOTY_MC_SHOOTY');
  const dmgPerItemsBonus = dmgPerItems * items / 50;

  const stampsCollected = calcStampCollected(account?.stamps);
  const dmgPerStamps = getTalentBonus(character?.flatTalents, 'PAPERWORK,_GREAT...');
  const dmgPerStampsBonus = dmgPerStamps * stampsCollected / 10;

  const dmgPerSpeed = getTalentBonus(character?.flatTalents, 'SPEEDNA');
  const dmgPerSpeedBonus = dmgPerSpeed * Math.floor((playerInfo.movementSpeed / 100 - 1) / .15)

  const dmgPerDungeonCredits = getTalentBonus(character?.flatStarTalents, 'DUNGEONIC_DAMAGE')
  const dmgPerDungeonCreditsBonus = dmgPerDungeonCredits * lavaLog(account?.accountOptions?.[71]);
  const hasDoot = isCompanionBonusActive(account, 0);
  const minorBonus = hasDoot ? getMinorDivinityBonus(character, account, 2) : character?.linkedDeity === 2
    ? character?.deityMinorBonus
    : character?.secondLinkedDeityIndex === 2
      ? character?.secondDeityMinorBonus
      : 0;

  const secondGoldenFoodBonus = getGoldenFoodBonus('Golden_Kebabs', character, account, characters) || 1;

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
  const secondStatueBonus = getStatueBonus(account, 22, character?.flatTalents);
  const talent113 = 0;
  const hpTalentBonus = getTalentBonus(character?.flatTalents, 'MEAT_SHANK');
  const mpTalentBonus = getTalentBonus(character?.flatTalents, 'OVERCLOCKED_ENERGY');
  const bribeBonus = account?.bribes?.[20]?.done ? account?.bribes?.[20]?.value : 0;
  const stampBonus = getStampsBonusByEffect(account, 'Total_Damage');

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
  const strWpTalent = getTalentBonus(character?.flatTalents, 'CARRY_A_BIG_STICK');
  const agiWpTalent = getTalentBonus(character?.flatTalents, 'HIGH_POLYMER_LIMBS');
  const intWpTalent = getTalentBonus(character?.flatTalents, 'POWER_OVERWHELMING');

  const baseWp = getTalentBonus(character?.flatTalents, 'SHARPENED_AXE');
  const weaponPower = getWeaponPower(character, characters, account);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Base_Damage')?.bonus ?? 0;
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Nomwich', character, account, characters);

  const stampsBonus = getStampsBonusByEffect(account, 'Base_Damage')
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Civil_War_Memory_Box', 0);
  const equipmentBonus = getStatsFromGear(character, 16, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[16]);
  const statueBonus = getStatueBonus(account, 0, character?.flatTalents);
  const hpBubbleBonus = getBubbleBonus(account, 'BIG_MEATY_CLAWS', false, mainStat === 'strength'); // above 250 HP
  const speedBubble = getBubbleBonus(account, 'QUICK_SLAP', false, mainStat === 'agility'); // works above 110% speed
  const mpBubble = getBubbleBonus(account, 'NAME_I_GUESS', false, mainStat === 'wisdom'); // 150 MP
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

  const foodBonus = getFoodBonus(character, account, 'BaseDmgBoosts');
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
  const goldenFoodBonus = getGoldenFoodBonus('Butter_Bar', character, account, characters) || 0;
  const stampBonus = getStampsBonusByEffect(account, 'Base_Accuracy');

  const baseAccuracy = 2 + vialBonus
    + (postOfficeBonus
      + (baseCardBonus
        + equipmentBonus
        + goldenFoodBonus)
      + stampBonus);

  const bubbleBonus = getBubbleBonus(account, 'SHAQURACY', false, mainStat === 'agility');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Accuracy');
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet4' ? character?.cards?.cardSet?.bonus : 0;
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'EXTENDO_RANGEO');
  const secondActiveBuff = getTalentBonusIfActive(character?.activeBuffs, 'BALANCED_SPIRIT');
  const starSignBonus = getStarSignBonus(character, account, 'Accuracy');
  const statueBonus = getStatueBonus(account, 14, character?.flatTalents);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Total_Accuracy')?.bonus;
  const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Accuracy');
  const bribeBonus = account?.bribes?.[21]?.done ? account?.bribes?.[21]?.value : 0;
  const tipToeQuickness = getTalentBonus(character?.flatStarTalents, 'TIPTOE_QUICKNESS', true);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Precision', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Beefy_For_Real', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Pain', account)?.curse;
  const chipBonus = getPlayerLabChipBonus(character, account, 2);

  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'TotAcc');
  const hasDoot = isCompanionBonusActive(account, 0);
  const minorBonus = hasDoot ? getMinorDivinityBonus(character, account, 0) : character?.linkedDeity === 0
    ? character?.deityMinorBonus
    : 0;

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
  const stampBonus = getStampsBonusByEffect(account, 'Base_MP');
  const mpTalentBonus = getTalentBonus(character?.flatTalents, 'MANA_BOOSTER');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Magician_Starterpack', 0);
  const postOfficePercentBonus = getPostOfficeBonus(character?.postOffice, 'Magician_Starterpack', 1);
  const maxHpTalentBonus = getTalentBonus(character?.flatTalents, 'MANA_OVERDRIVE');
  const agiMaxHpTalentBonus = getTalentBonus(character?.flatTalents, 'HEMA_OVERDRIVE');

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
  const foodBonus = getFoodBonus(character, account, 'HpBaseBoosts');
  const statueBonus = getStatueBonus(account, 4, character?.flatTalents);

  const baseHp = foodBonus + statueBonus;

  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_HP');
  const cardPercentBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_HP');
  const hpBubble = 0;
  const stampBonus = getStampsBonusByEffect(account, 'Base_HP');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Locally_Sourced_Organs', 0);
  const postOfficePercentBonus = getPostOfficeBonus(character?.postOffice, 'Locally_Sourced_Organs', 1);
  const hpTalentBonus = getTalentBonus(character?.flatTalents, 'HEALTH_BOOSTER');
  const hpStarTalentBonus = getTalentBonus(character?.flatStarTalents, 'UBERCHARGED_HEALTH');
  const hpPercentTalentBonus = getTalentBonus(character?.flatTalents, 'STRENGTH_IN_NUMBERS');
  const maxHpTalentBonus = getTalentBonus(character?.flatTalents, 'HEALTH_OVERDRIVE');
  const agiMaxHpTalentBonus = getTalentBonus(character?.flatTalents, 'HEMA_OVERDRIVE');
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'NO_PAIN_NO_GAIN');
  const starSignBonus = getStarSignBonus(character, account, 'Total_HP');

  const highestLevelSquire = getHighestLevelOf(characters, CLASSES.Squire)
  const theFamilyGuy = getTalentBonus(character?.flatTalents, 'THE_FAMILY_GUY')
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_HP', highestLevelSquire);
  const amplifiedFamilyBonus = familyBonus * (checkCharClass(character?.class, CLASSES.Squire) && character?.level === highestLevelSquire && theFamilyGuy > 0
    ? (1 + theFamilyGuy / 100)
    : 1)

  const equipmentBonus = getStatsFromGear(character, 15, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[15]);
  const shrineBonus = getShrineBonus(account?.shrines, 1, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Jam', character, account, characters) || 1;

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
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 3);
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'DUSTER_STUDS');
  const equipmentBonus = getStatsFromGear(character, 'Weapon_Power', account);
  const obols = getObolsBonus(character?.obols, 'Weapon_Power');
  const chipBonus = getPlayerLabChipBonus(character, account, 19);
  const strBubbleBonus = mainStat === 'strength'
    ? getBubbleBonus(account, 'SPEAR_POWAH', false, mainStat === 'strength')
    : 0;
  const agiBubbleBonus = mainStat === 'agility'
    ? getBubbleBonus(account, 'BOW_POWER', false, mainStat === 'agility')
    : 0;
  const intBubbleBonus = mainStat === 'wisdom' || mainStat === 'luck'
    ? getBubbleBonus(account, 'WAND_PAWUR', false, mainStat === 'wisdom')
    : 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'WeaponPOW');
  const highestLevelBarbarian = getHighestLevelOf(characters, CLASSES.Barbarian)
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'WEAPON_POWER', highestLevelBarbarian);
  const starSignBonus = getStarSignBonus(character, account, 'Weapon_Power');
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Weapon_Power')?.bonus;
  const wpPerCookingTalentBonus = getTalentBonus(character?.flatTalents, 'TOUGH_STEAKS');
  const wpPerGamingTalentBonus = getTalentBonus(character?.flatTalents, 'GAMER_STRENGTH');
  const wpPerSailingTalentBonus = Math.round(getTalentBonus(character?.flatTalents, 'CREW_ROWING_STRENGTH') * 10) / 10;
  const wpPerDivinityTalentBonus = getTalentBonus(character?.flatTalents, 'BELIEVER_STRENGTH');
  const wpPerPetTalentBonus = getTalentBonus(character?.flatTalents, 'ANIMALISTIC_FEROCITY');
  const wpPerLabTalentBonus = getTalentBonus(character?.flatTalents, 'WIRED_IN_POWER');

  const firstStoredPet = account?.breeding?.storedPets?.[0]?.power ?? 0;
  const highestBeginner = getHighestLevelOf(characters, CLASSES.Beginner);
  const beginnerBonus = getTalentBonus(character?.flatStarTalents, 'BEGINNER_BEST_CLASS');
  const bestBeginnerBonus = Math.min(beginnerBonus, Math.floor(highestBeginner / 10));
  const wpFromFood = getFoodBonus(character, account, 'WeaponPowerBoosts');

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
const getCritDamage = (character, characters, account) => {
  const mainStat = mainStatMap?.[character?.class];
  const wisTalentBonus = getTalentBonus(character?.flatTalents, 'FARSIGHT');
  const warTalentBonus = getTalentBonus(character?.flatTalents, 'CRITIKILL');
  const begTalentBonus = getTalentBonus(character?.flatTalents, 'KNUCKLEBUSTER');
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'DIVINE_INTERVENTION');
  const bubbleBonus = getBubbleBonus(account, 'BAPPITY_BOOPITY', false, mainStat === 'strength');
  const stampBonus = getStampsBonusByEffect(account, 'Critical_Damage');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Critical_Damage');
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Circular_Criticals', account)?.curse;
  const equipmentBonus = getStatsFromGear(character, 22, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[22]);
  const statueBonus = getStatueBonus(account, 5, character?.flatTalents);
  let critDamage;
  if (1e3 > character?.stats?.strength) {
    critDamage = (Math.pow(character?.stats?.strength + 1, 0.37) - 1) / 40;
  }
  else {
    critDamage = ((character?.stats?.strength - 1e3) / (character?.stats?.strength + 2500)) * 0.5 + 0.255;
  }
  return 1.2 + (warTalentBonus + statueBonus + (wisTalentBonus
    + (stampBonus + ((100 * critDamage) / 1.8 + (bubbleBonus
      + (cardBonus - prayerCurse + (begTalentBonus + (equipmentBonus + obolsBonus + activeBuff)))))))) / 100;
}
const getCritChance = (character, characters, account, playerInfo) => {
  const mainStat = mainStatMap?.[character?.class];
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Critical_Chance');
  const cardBonusPassive = getCardBonusByEffect(account?.cards, 'Critical_Chance_(Passive)');
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet6' ? character?.cards?.cardSet?.bonus : 0;
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Circular_Criticals', account)?.bonus;
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Crit');
  const statueBonus = getStatueBonus(account, 13, character?.flatTalents);
  const starTalentBonus = getTalentBonus(character?.flatStarTalents, 'MEGA_CRIT');
  const secondStarTalentBonus = getTalentBonus(character?.flatStarTalents, 'OVERACCURATE_CRIT');
  const starSignBonus = getStarSignBonus(character, account, 'Crit_Chance');
  const equipmentBonus = getStatsFromGear(character, 23, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[23]);
  const arcTalentBonus = getTalentBonus(character?.flatTalents, 'I_SEE_YOU');
  const wisTalentBonus = getTalentBonus(character?.flatTalents, 'FARSIGHT', true);
  const achievementBonus = getAchievementStatus(account?.achievements, 184);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Civil_War_Memory_Box', 2);
  const monster = monsters?.[character?.targetMonster];
  const acc = Math.floor(playerInfo?.accuracy)
  const perAccuracy = lavaLog(acc - 1.5 * monster?.Defence);
  const perAccuracyBonus = secondStarTalentBonus * perAccuracy;
  const bubbleBonus = getBubbleBonus(account, 'CHEAP_SHOT', false, mainStat === 'agility');

  let critChance;
  if (1e3 > character?.stats?.agility) {
    critChance = (Math.pow(character?.stats?.agility + 1, 0.37) - 1) / 40;
  }
  else {
    critChance = ((character?.stats?.agility - 1e3) / (character?.stats?.agility + 2500)) * 0.5 + 0.255;
  }

  return 5 + cardSetBonus
    + (cardBonus
      + Math.min(cardBonusPassive, 50)
      + (starTalentBonus
        + (equipmentBonus + obolsBonus)
        + (prayerBonus
          + mealBonus
          + statueBonus
          + starSignBonus)))
    + (arcTalentBonus
      + (wisTalentBonus
        + 5 * achievementBonus
        + (postOfficeBonus
          + perAccuracyBonus) + (critChance / 2.3 * 100 + bubbleBonus)))
}
const getHitChance = (character, characters, account, playerInfo) => {
  const monster = monsters?.[character?.targetMonster];
  const effectiveAccuracy = playerInfo?.accuracy / monster?.Defence;
  return .5 <= effectiveAccuracy ?
    Math.floor(Math.min(100 * (.95 * effectiveAccuracy - .425), 100)) : 0;
}
const getKillsPerHour = (character, characters, account, playerInfo) => {
  const dEffect = getTalentEffectOnKills(character, account, 'D');
  const kEffect = getTalentEffectOnKills(character, account, 'K');
  const mainStat = mainStatMap?.[character?.class];
  const charWeapon = character?.equipment?.[1]?.Speed || 0;
  const equipmentBonus = getStatsFromGear(character, 56, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[56]);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'AtkSpd');
  const chipBonus = getPlayerLabChipBonus(character, account, 4);
  const bubbleBonus = getBubbleBonus(account, 'HYPERSWIFT', false, mainStat === 'wisdom');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Deaths_Storage_Unit', 1);
  const monster = monsters?.[character?.targetMonster];
  const monsterHp = getMonsterHpTotal(monster?.MonsterHPTotal, character, account);
  const mapNumber = mapDetails?.[character?.mapIndex]?.[1]?.[0];
  const anotherMapNumber = mapDetails?.[character?.mapIndex]?.[1]?.[1];
  const K = Math.min(Math.max(kEffect, 1), 2.2);
  const actionWaitTime = Math.max(0.1, (1 + (10 - charWeapon) / 5) /
    (1 + ((equipmentBonus + obolsBonus) + (mealBonus + (chipBonus + (bubbleBonus
      + postOfficeBonus)))) / 100));
  const first = playerInfo?.maxDamage * (playerInfo.mastery + (1 - playerInfo.mastery) / 2)
    * (1 + (playerInfo.critDamage - 1) * (playerInfo.critChance / 100))
    * (playerInfo.hitChance / 100) * Math.max(dEffect, 1);

  const hourlyKills = 0 < playerInfo.hitChance
    ? Math.min(mapNumber / (playerInfo.respawnRate + 0.1), K / (anotherMapNumber /
      (130 * (playerInfo?.movementSpeed / 100)) + actionWaitTime * Math.max((monsterHp / first + 0.52)
        * (1 / (playerInfo.hitChance / 100)), 1))) : Math.min(mapNumber / (playerInfo.respawnRate + 0.1),
      K / (anotherMapNumber / (130 * playerInfo?.movementSpeed) + actionWaitTime * Math.max(monsterHp / first + 0.52, 1)));
  return Math.floor(3600 * hourlyKills);
}
const getTalentEffectOnKills = (character, account, stat) => {
  const mainStat = mainStatMap?.[character?.class];
  const effect = character?.talentsLoadout?.reduce((sum, talent) => {
    if (talent?.AFKactivity !== 0 || talent?.[stat] === 1) return sum;
    return sum * (talent?.[stat] || 1) * (1 + Math.min(1, talent?.baseLevel / (talent?.baseLevel + 100)))
  }, 1);

  const starTalentBonus = getTalentBonus(character?.flatStarTalents, 'ATTACKS_ON_SIMMER');
  const talentBonus = getTalentBonus(character?.flatTalents, 'TWO_PUNCH_MAN');
  const secondTalentBonus = getTalentBonus(character?.flatTalents, 'TRIPLE_JAB');
  const thirdTalentBonus = getTalentBonus(character?.flatTalents, 'DOUBLE_STRIKE');
  const fourthTalentBonus = getTalentBonus(character?.flatTalents, 'HAVE_ANOTHER!');
  const fifthTalentBonus = getTalentBonus(character?.flatTalents, 'HAVE_ANOTHER..._AGAIN!');
  const bubbleBonus = getBubbleBonus(account, 'ALL_FOR_KILL', false, mainStat === 'wisdom');

  return 'D' === stat ? effect
    * (1 + (Math.min(starTalentBonus, 25) + Math.min(bubbleBonus, 25)) / 100)
    * (1 + (talentBonus + (secondTalentBonus + (thirdTalentBonus
      + (fourthTalentBonus + fifthTalentBonus)))) / 100) : effect;
}

const getMonsterHpTotal = (baseHp, character, account) => {
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Big_Brain_Time', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Midas_Minded', account)?.curse;
  const thirdPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Jawbreaker', account)?.curse;

  return baseHp * (1 + (prayerCurse + (secondPrayerCurse + thirdPrayerCurse)) / 100);
}

const getSurvivability = (character, characters, account, playerInfo) => {
  const monster = monsters?.[character?.targetMonster];
  let monsterDamage = getMonsterDamage(monster, character, account, playerInfo);
  const talentBonus = getTalentBonus(character?.flatTalents, 'MANA_IS_LIFE');
  if (talentBonus) {
    monsterDamage = monsterDamage / (1 + talentBonus / 100);
  }
  const hpFromFood = getHealthFoodBonus(character, account, 'Health');
  const starTalentBonus = getTalentBonus(character?.flatStarTalents, 'GOBLET_OF_HEMOGLOBIN');
  const healFromFood = hpFromFood + playerInfo?.survivabilityMath * (starTalentBonus / 100) * playerInfo?.maxHp;
  const mapNumber = mapDetails?.[character?.mapIndex]?.[1]?.[2];
  let math = monsterDamage * mapNumber - healFromFood; // q
  if (math > 0) {
    math = playerInfo?.maxHp / math;
    const secondStarTalentBonus = getTalentBonus(character?.flatStarTalents, 'BORED_TO_DEATH');
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Locally_Sourced_Organs', 2);
    const autoRespawnTime = 0 === secondStarTalentBonus ? 600 / (1 + Math.min(50, Math.max(0, postOfficeBonus) / 100)) :
      Math.max(secondStarTalentBonus / (1 + Math.min(50, Math.max(0, postOfficeBonus)) / 100), 100)
    let anotherMath = math / (math + autoRespawnTime / 3600);
    return Math.min(Math.round(100 * anotherMath), 100);
  }
  else {
    return 100;
  }
}

const getMonsterDamage = (monster, character, account, playerInfo) => {
  const { Damages } = monster || {};
  const base = Damages?.[0] - 2.5 * Math.pow(playerInfo?.defence?.value, 0.8);
  const baseDef = Math.pow(playerInfo?.defence?.value, 1.5) / 100;
  let monsterDamage = base / Math.max(1 + (playerInfo?.defence?.value / Math.max(Damages?.[0], 1)) * baseDef, 1);
  const talentCurse = getTalentBonusIfActive(character?.activeBuffs, 'NO_PAIN_NO_GAIN');
  const talentBonus = getTalentBonus(character?.flatTalents, 'BRICKY_SKIN');
  if (talentCurse) {
    monsterDamage *= 2;
  }
  if (talentBonus) {
    monsterDamage *= Math.max(0.05, 1 - talentBonus / 100);
  }
  return monsterDamage < .5 ? 0 : Math.max(Math.ceil(monsterDamage), 0)
}

const getPlayerDefence = (character, characters, account) => {
  const mainStat = mainStatMap?.[character?.class];
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Box_of_Unwanted_Stats', 1);
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet4' ? character?.cards?.cardSet?.bonus : 0;
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_Defence');
  const secondCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Defence_from_Equipment');
  const bubbleBonus = getBubbleBonus(account, 'FMJ', false, mainStat === 'strength');
  const stampBonus = getStampsBonusByEffect(account, 'Base_Defence');
  const toolBonus = getStatsFromGear(character, 'Defence', account, true);
  const equipmentBonus = getStatsFromGear(character, 'Defence', account);
  const obolsBonus = getObolsBonus(character?.obols, 'Defence');
  const equipmentBonusEtc = getStatsFromGear(character, 50, account);
  const obolsBonusEtc = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[50]);
  const secondEquipmentBonusEtc = getStatsFromGear(character, 7, account);
  const secondObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[7]);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Base_Defence')?.bonus ?? 0;
  const statueBonus = getStatueBonus(account, 7, character?.flatTalents);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Def');
  const talentBonus = getTalentBonus(character?.flatTalents, 'BRICKY_SKIN', true);
  const secondTalentBonus = getTalentBonus(character?.flatTalents, 'BUCKLERED_UP');
  const shrineBonus = getShrineBonus(account?.shrines, 1, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const bribeBonus = account?.bribes?.[22]?.done ? account?.bribes?.[22]?.value : 0;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Beefy_For_Real', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Pain', account)?.curse;
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Meat_Pie', character, account, characters);
  const starSignBonus = getStarSignBonus(character, account, 'Defence');
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'BALANCED_SPIRIT');
  const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Defence');
  const chipBonus = getPlayerLabChipBonus(character, account, 0);
  const hasDoot = isCompanionBonusActive(account, 0);
  const minorBonus = hasDoot ? getMinorDivinityBonus(character, account, 0) : character?.linkedDeity === 0
    ? character?.deityMinorBonus
    : 0;


  const value = Math.floor(postOfficeBonus
      + cardBonus + Math.min(character?.level,
        bubbleBonus)
      + (stampBonus
        + (equipmentBonusEtc + obolsBonusEtc)
        + arcadeBonus
        + statueBonus)
      + ((equipmentBonus + obolsBonus + toolBonus)
        * (1 + (bubbleBonus + secondCardBonus) / 100)
        + (mealBonus + talentBonus)))
    * (1 + (shrineBonus + bribeBonus) / 100)
    * Math.max(0.05, 1 - (prayerCurse + secondPrayerCurse) / 100)
    * (1 + (goldenFoodBonus + secondTalentBonus +
      ((secondEquipmentBonusEtc + secondObolsBonus) + (starSignBonus
        + (activeBuff + (cardSetBonus + (flurboBonus
          + chipBonus)))))) / 100) * (1 + minorBonus / 100);

  const breakdown = [
    { name: 'Post Office', value: postOfficeBonus },
    { name: 'Card Bonus', value: cardBonus + secondCardBonus },
    { name: 'Cardset Bonus', value: cardSetBonus },
    { name: 'Flurbo Bonus', value: flurboBonus },
    { name: 'Minor Divinity Bonus', value: minorBonus },
    { name: 'Chip Bonus', value: chipBonus },
    { name: 'Bubble Bonus', value: bubbleBonus },
    { name: 'Stamp Bonus', value: stampBonus },
    { name: 'Equip Base Defence ', value: equipmentBonusEtc + obolsBonusEtc },
    { name: 'Equip Defence', value: equipmentBonus + obolsBonus + toolBonus },
    { name: 'Equip % Defence', value: secondEquipmentBonusEtc + secondObolsBonus },
    { name: 'Arcade Bonus', value: arcadeBonus },
    { name: 'Statue Bonus', value: statueBonus },
    { name: 'Meal Bonus', value: mealBonus },
    { name: 'Shrine Bonus', value: shrineBonus },
    { name: 'Bribe Bonus', value: bribeBonus },
    { name: 'Prayers', value: prayerCurse + secondPrayerCurse },
    { name: 'Golden Food', value: goldenFoodBonus },
    { name: 'Talents Bonus', value: talentBonus + secondTalentBonus },
    { name: 'Active Talents Bonus', value: activeBuff }
  ]

  return {
    value,
    breakdown
  }
}

const getKillPerKill = (character, characters, account, playerInfo) => {
  const equipmentBonus = getStatsFromGear(character, 68, account);
  const secondEquipmentBonus = getStatsFromGear(character, 69, account);
  const thirdEquipmentBonus = getStatsFromGear(character, 70, account);
  const monster = monsters?.[character?.targetMonster];
  const monsterHp = getMonsterHpTotal(monster?.MonsterHPTotal, character, account);
  const overKill = playerInfo?.maxDamage >= 2 * monsterHp && 0.5 < account?.towers?.towersTwo
    ? playerInfo?.accuracy > 1.5 * monster?.Defence
    : 0;
  const labBonus = getLabBonus(account?.lab?.labBonuses, 4);
  let worldBonus = 0;
  if (100 <= character?.mapIndex && 150 > character?.mapIndex) {
    worldBonus = equipmentBonus
  }
  else if (150 <= character?.mapIndex && 200 > character?.mapIndex) {
    worldBonus = secondEquipmentBonus
  }
  else if (50 <= character?.mapIndex && 100 > character?.mapIndex) {
    worldBonus = thirdEquipmentBonus
  }
  const majorBonus = isCompanionBonusActive(account, 0)
  || character?.linkedDeity === 2
  || character?.secondLinkedDeityIndex === 2 ? 1 : 0;
  const strTalentBonus = getTalentBonus(character?.flatTalents, 'CHARRED_SKULLS');
  const agiTalentBonus = getTalentBonus(character?.flatTalents, 'STACKED_SKULLS');
  const wisTalentBonus = getTalentBonus(character?.flatTalents, 'MEMORIAL_SKULLS');
  const warTalentBonus = getTalentBonus(character?.flatTalents, 'MONSTER_DECIMATOR');
  const multiKillTotal = getMultiKillTotal(character, characters, account, playerInfo);
  const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'KILL_PER_KILL', account);

  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Fibers_of_Absence', account)?.bonus;
  return overKill ?
    Math.max(1, labBonus)
    * (1 + worldBonus / 100)
    * Math.max(1, 1 + majorBonus)
    * (1 + (strTalentBonus
      * (character?.stats?.strength / 1e3)
      + (agiTalentBonus
        * (character?.stats?.agility / 1e3)
        + (wisTalentBonus
          * (character?.stats?.wisdom / 1e3)
          + warTalentBonus))
      + (multiKillTotal
        + (activeBubbleBonus
          + prayerBonus))) / 100) :
    Math.max(1, labBonus)
    * (1 + worldBonus / 100)
    * Math.max(1, 1 + majorBonus)
    * (1 + (strTalentBonus * (character?.stats?.strength / 1e3)
      + (agiTalentBonus
        * (character?.stats?.agility / 1e3)
        + (wisTalentBonus
          * (character?.stats?.wisdom / 1e3)
          + warTalentBonus))
      + (activeBubbleBonus
        + prayerBonus)) / 100)
}

const getMultiKillTotal = (character, characters, account, playerInfo) => {
  const starSignBonus = getStarSignBonus(character, account, 'Total_Multikill');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 8);
  const stampsBonus = getStampsBonusByEffect(account, 'Base_Overkill')
  const equipmentBonus = getStatsFromGear(character, 29, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[29]);
  const monster = monsters?.[character?.targetMonster];
  const monsterHp = getMonsterHpTotal(monster?.MonsterHPTotal, character, account);
  let multiKills = 1;
  for (let i = 0; i < 50; i++) {
    if (playerInfo?.maxDamage >= (2 * monsterHp * Math.pow(2, i + 1))) {
      multiKills = i + 2;
    }
  }
  const deathNoteRank = account?.deathNote?.[Math.floor(character?.mapIndex / 50)]?.rank || 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'Overkill');
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'VOID_RADIUS');
  const voidTalentBonus = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'MASTER_OF_THE_SYSTEM');
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Multikill_per_Tier')?.bonus ?? 0;
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Trilobite_Rock')?.bonus ?? 0;
  const secondActiveBuff = getTalentBonusIfActive(character?.activeBuffs, 'MANA_IS_LIFE', 'y');
  const chipBonus = getPlayerLabChipBonus(character, account, 14);
  const secondEquipmentBonus = getStatsFromGear(character, 71, account);
  const secondObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[71]);
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Multikill_per_tier');
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Pain', account)?.bonus;
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Multikill_Per_Tier');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Utilitarian_Capsule', 1);
  const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'MR_MASSACRE', account);
  const achievement = getAchievementStatus(account?.achievements, 148);
  const achievementTwo = getAchievementStatus(account?.achievements, 122);
  const achievementThree = getAchievementStatus(account?.achievements, 123);

  return Math.floor(starSignBonus
    + saltLickBonus
    + (stampsBonus
      + 2 * account?.towers?.towersTwo)
    + ((equipmentBonus + obolsBonus)
      + (Math.min(5, achievement)
        + (6 * achievementTwo
          + 2 * achievementThree)))
    + multiKills
    * (deathNoteRank
      + (vialBonus
        + (activeBuff
          + voidTalentBonus
          * Math.floor(account?.accountOptions?.[158] / 5))
        + (arcadeBonus
          + (artifactBonus
            + secondActiveBuff)
          + (chipBonus
            + ((secondEquipmentBonus + secondObolsBonus)
              + cardBonus
              + (prayerBonus
                + shinyBonus)))
          + (postOfficeBonus + activeBubbleBonus)))))

}