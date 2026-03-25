import type { Account, Character } from './types';
import {
  checkCharClass,
  CLASSES,
  getHighestTalentByClass,
  getTalentBonus,
  getTalentBonusIfActive,
  mainStatMap
} from './talents';
import { getPostOfficeBonus } from './world-3/postoffice';
import { getDungeonFlurboStatBonus } from './dungeons';
import { getCardBonusByEffect } from './cards';
import { getGuildBonusBonus } from './guild';
import { getActiveBubbleBonus, getBubbleBonus, getSigilBonus, getVialsBonusByStat } from './world-2/alchemy';
import { getStatsFromGear } from './items';
import { getObolsBonus } from './obols';
import { getFamilyBonusBonus } from './family';
import { bonuses, classFamilyBonuses, mapDetails, monsters, randomList } from '@website-data';
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
import { getArcadeBonus } from './world-2/arcade';
import { getAfkGain, getPlayerSpeedBonus, getRespawnRate } from './character';
import { getStatueBonus } from './world-1/statues';
import { calcStampCollected, getStampsBonusByEffect } from './world-1/stamps';
import { lavaLog, lavaLog2 } from '@utility/helpers';
import { getShrineBonus } from './world-3/shrines';
import { getPrayerBonusAndCurse } from './world-3/prayers';
import { getLabBonus, getPlayerLabChipBonus } from './world-4/lab';
import { getMealsBonusByEffectOrStat } from './world-4/cooking';
import { getEclipseSkullsBonus } from './world-3/deathNote';
import { isArtifactAcquired } from './world-5/sailing';
import { getAtomBonus } from './world-3/atomCollider';
import { getShinyBonus } from './world-4/breeding';
import { isSuperbitUnlocked } from './world-5/gaming';
import { constructionMasteryThresholds } from './world-3/construction';
import { getSaltLickBonus } from './world-3/saltLick';
import { getAchievementStatus } from './achievements';
import { getGodBlessingBonus, getMinorDivinityBonus } from './world-5/divinity';
// getEquinoxBonus not used — AdditionExtraDMG uses talent-based calculation
import { getMiningEff } from '@parsers/efficiency';
import { getUpgradeVaultBonus } from './misc/upgradeVault';
import { getOwlBonus } from './world-1/owl';
import { getKangarooBonus } from './world-2/kangaroo';
import { getVoteBonus } from './world-2/voteBallot';
import { getLandRank, getExoticMarketBonus } from './world-6/farming';
import { getWinnerBonus, getSummoningUpgradeBonus } from './world-6/summoning';
import { getSchematicBonus } from './world-5/caverns/the-well';
import { calcTotalQuestCompleted, getFriendBonus } from './misc';
import { getArmorSetBonus } from './world-3/armorSmithy';
import { getCosmoBonus } from './world-5/hole';
import { getPaletteBonus } from './world-5/gaming';
import { getCharmBonus } from './world-6/sneaking';
import { getGrimoireBonus } from './class-specific/grimoire';
import { getMonumentBonus } from './world-5/caverns/bravery';
import { getCompassBonus } from './class-specific/compass';
import { getMeritocracyBonus } from './world-2/voteBallot';
import { getMineheadBonusQTY } from './world-7/minehead';
import { isBundlePurchased } from './misc';
import { notateNumber } from '@utility/helpers';

export const getMaxDamage = (character: Character, characters: Character[], account: Account) => {
  const playerInfo: any = { survivabilityMath: 0 };
  const mainStat = mainStatMap?.[character?.class];
  const strTalentBonus = getTalentBonus(character?.flatTalents, 'STRENGTH_IN_NUMBERS');
  const intTalentBonus = getTalentBonus(character?.flatTalents, 'KNOWLEDGE_IS_POWER');
  const lukTalentBonus = getTalentBonus(character?.flatTalents, 'LUCKY_HIT');
  let statBubbleBonus = 0;
  if (mainStat === 'strength') {
    statBubbleBonus = getBubbleBonus(account, 'FARQUAD_FORCE', false, mainStat === 'strength');
  } else if (mainStat === 'agility') {
    statBubbleBonus = getBubbleBonus(account, 'QUICKDRAW_QUIVER', false, mainStat === 'agility');
  } else if (mainStat === 'wisdom') {
    statBubbleBonus = getBubbleBonus(account, 'SMARTER_SPELLS', false, mainStat === 'wisdom');
  }
  const damageFromStat = ((character?.stats as any)?.[mainStat] || 0) * (1 + (strTalentBonus
    + (intTalentBonus
      + lukTalentBonus)
    + statBubbleBonus) / 100);

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

  const { baseDamage, sources: baseDamageSources, subSections: baseSubSections } = getBaseDamage(character, characters, account, playerInfo, damageFromStat)
  const { value: hpMpDamage, sources: hpMpSources, subSections: hpMpSubSections } = getDamageFromHpMp(character, characters, account, playerInfo, damageFromStat);
  const { value: perDamage, sources: perXSources, subSections: perXSubSections } = getDamageFromPerX(character, characters, account, playerInfo, hpMpDamage);
  const { value: percentDamage, sources: percentSources, subSections: percentSubSections } = getDamagePercent(character, characters, account, playerInfo);
  playerInfo.maxDamage = baseDamage * perDamage * percentDamage;
  playerInfo.minDamage = playerInfo.mastery * playerInfo.maxDamage;
  playerInfo.damageBreakdown = {
    statName: 'Damage',
    totalValue: notateDamage(playerInfo)[0],
    categories: [
      { name: 'Base Damage', sources: baseDamageSources, subSections: baseSubSections },
      { name: 'HP/MP Damage', sources: hpMpSources, subSections: hpMpSubSections },
      { name: 'Per-X Bonuses', sources: perXSources, subSections: perXSubSections },
      { name: 'Damage %', sources: percentSources, subSections: percentSubSections },
    ]
  };
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

export const notateDamage = (playerInfo: any) => {
  const { minDamage, maxDamage } = playerInfo;
  let notation;

  if (maxDamage < 9999999) {
    // Raw numbers: "1234~5678"
    notation = `${Math.ceil(minDamage)}~${Math.ceil(maxDamage)}`;
  } else if (maxDamage < 999999999) {
    // Millions with [ suffix: "1.234[~5.678["
    notation = `${Math.ceil(minDamage / 1e3) / 1e3}[~${Math.ceil(maxDamage / 1e3) / 1e3}[`;
  } else if (maxDamage < 99999999999) {
    // Tens of billions with [ suffix
    notation = `${Math.ceil(minDamage / 1e5) / 10}[~${Math.ceil(maxDamage / 1e5) / 10}[`;
  } else if (maxDamage < 9999999999999) {
    // Trillions with [ suffix
    notation = `${Math.ceil(minDamage / 1e6) / 1}[~${Math.ceil(maxDamage / 1e6) / 1}[`;
  } else if (maxDamage < 999999999999999) {
    // Hundreds of trillions with ! suffix
    notation = `${Math.ceil(minDamage / 1e9) / 1e3}!~${Math.ceil(maxDamage / 1e9) / 1e3}!`;
  } else if (maxDamage < 1e17) {
    // Quadrillions with ! suffix
    notation = `${Math.ceil(minDamage / 1e11) / 10}!~${Math.ceil(maxDamage / 1e11) / 10}!`;
  } else if (maxDamage < 1e19) {
    // Tens of quadrillions with ! suffix
    notation = `${Math.ceil(minDamage / 1e12) / 1}!~${Math.ceil(maxDamage / 1e12) / 1}!`;
  } else if (maxDamage < 1e21) {
    // Quintillions with | prefix
    notation = `|${Math.ceil(minDamage / 1e15) / 1e3}~${Math.ceil(maxDamage / 1e15) / 1e3}`;
  } else if (maxDamage < 1e23) {
    // Hundreds of quintillions with | prefix
    notation = `|${Math.ceil(minDamage / 1e17) / 10}~${Math.ceil(maxDamage / 1e17) / 10}`;
  } else if (maxDamage < 1e25) {
    // Sextillions with | prefix
    notation = `|${Math.ceil(minDamage / 1e18) / 1}~${Math.ceil(maxDamage / 1e18) / 1}`;
  } else if (maxDamage < 1e27) {
    notation = `|${Math.ceil(minDamage / 1e18 / 1e3) / 1e3}棘~${Math.ceil(maxDamage / 1e18 / 1e3) / 1e3}棘`;
  } else if (maxDamage < 1e28) {
    notation = `|${Math.ceil(minDamage / 1e18 / 1e5) / 10}棘~${Math.ceil(maxDamage / 1e18 / 1e5) / 10}棘`;
  } else {
    notation = `|${Math.ceil(minDamage / 1e18 / 1e6) / 1}棘~${Math.ceil(maxDamage / 1e18 / 1e6) / 1}棘`;
  }

  return [notation];
}

// "Mastery" == e
const getMastery = (character: Character, characters: Character[], account: Account) => {
  const mainStat = mainStatMap?.[character?.class];
  const talent113 = 0;
  const bubbleBonus = getBubbleBonus(account, 'LIL_BIG_DAMAGE', false, mainStat === 'agility');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Minimum_Damage');
  const talentBonus = getTalentBonus(character?.flatTalents, 'MASTERY_UP');
  const { value: equipmentBonus } = getStatsFromGear(character, 21, account);

  return Math.min(.8, .35 - talent113
    / 100 + (bubbleBonus
      + (cardBonus + (talentBonus + (equipmentBonus)))) / 100);
}

const getDamagePercent = (character: Character, characters: Character[], account: Account, _unused3?: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const { strength, agility, wisdom, luck } = character?.stats || {};

  // === Pre-softcap bonuses (game DamageDealtLIST[2] initial push) ===
  // Game: WorkbenchStuff('AdditionExtraDMG') uses highest talent across ALL characters
  // (1 + talent508 * log(opt152) / 100) * (1 + talent208 * log(opt329) / 100)
  const wormHoleTalent = getHighestTalentByClass(characters, CLASSES.Elemental_Sorcerer, 'WORMHOLE_EMPEROR', false, false, false, false, character);
  const perWormholeKills = 1 + (wormHoleTalent * lavaLog(Number(account?.accountOptions?.[152]) || 0)) / 100;
  // Talent 208 = WRAITH_OVERLORD — available on Death_Bringer (Warrior path)
  const wraithOverlordTalent = getHighestTalentByClass(characters, CLASSES.Death_Bringer, 'WRAITH_OVERLORD', false, false, false, false, character);
  const perEquinoxKills = 1 + (wraithOverlordTalent * lavaLog(Number(account?.accountOptions?.[329]) || 0)) / 100;
  const vialDmgBonus = getVialsBonusByStat(account?.alchemy?.vials, '7dmg') || 0;
  const eclipseSkulls = getEclipseSkullsBonus(account);
  const paletteBonus = getPaletteBonus(account, 34);
  const dreamBonus = (account as any)?.equinox?.rawDream?.[6] ?? 0; // Dream[6] - raw equinox data, TODO: expose on equinox parser
  const pristineCharmBonus = getCharmBonus(account, 'Sparkle_Log');
  const summUpg79 = getSummoningUpgradeBonus(account, 79);

  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'NO_PAIN_NO_GAIN');
  const starSignBonus = getStarSignBonus(character, account, 'Total_Damage');
  const unlockedGods = account?.divinity?.unlockedDeities ?? 0;
  // Game uses getbonus2(1, talentId, -1) = highest across ALL characters
  const godTalent = getHighestTalentByClass(characters, CLASSES.Elemental_Sorcerer, 'GODS_CHOSEN_CHILDREN', false, true, false, false, character);
  const orbTalent = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'POWER_ORB', false, false, false, false, character);
  const friendBonus = getFriendBonus(account, 0);

  const grimoireUpg35 = getGrimoireBonus(account?.grimoire?.upgrades, 35);
  const lustreSetBonus = getArmorSetBonus(account, 'LUSTRE_SET') || 0;
  const shrineBonus = getShrineBonus(account?.shrines, 0, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 6 }) || 0;
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
  const shimmerBonus = Number(account?.accountOptions?.[178]) * (account?.islands?.allShimmerBonus || 0) || 0;
  const cropScBonus = account?.farming?.cropDepot?.damage?.value || 0;
  const vaultUpg41 = (getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 41) || 0) * lavaLog(Number(account?.accountOptions?.[346]) || 0);

  const skillMasteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 0);
  const strPercBubbleBonus = getBubbleBonus(account, 'BRITTLEY_SPEARS', false, mainStat === 'strength')
  const agiPercBubbleBonus = getBubbleBonus(account, 'BOW_JACK', false, mainStat === 'agility')
  const wisPercBubbleBonus = getBubbleBonus(account, 'MATTY_STAFFORD', false, mainStat === 'wisdom')
  const strBubbleBonus = mainStat === 'strength' || mainStat === 'luck'
    ? getBubbleBonus(account, 'POWER_TRIONE', false, mainStat === 'strength') : 0;
  const agiBubbleBonus = mainStat === 'agility'
    ? getBubbleBonus(account, 'POWER_TRITWO', false, mainStat === 'agility') : 0;
  const wisBubbleBonus = mainStat === 'wisdom'
    ? getBubbleBonus(account, 'POWER_TRITHREE', false, mainStat === 'wisdom') : 0;
  const constructMastery = account?.towers?.totalLevels >= constructionMasteryThresholds?.[2]
    ? 2 * Math.floor((account?.towers?.totalLevels - constructionMasteryThresholds?.[2]) / 10) : 0;
  const tomeBonus0 = account?.tome?.bonuses?.[0]?.bonus || 0;
  const compassBonus48 = getCompassBonus(account, 48);
  const exoticBonus41 = getExoticMarketBonus(account, 41);
  const accountOpt419 = Number(account?.accountOptions?.[419]) || 0;

  const talentBonus = getTalentBonus(character?.flatTalents, 'GILDED_SWORD');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 9);
  const { value: equipmentBonus } = getStatsFromGear(character, 45, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[45]);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Beefy_For_Real', account)?.bonus;
  const labBonus = getLabBonus(account?.lab?.labBonuses, 0);
  const secondLabBonus = getLabBonus(account?.lab?.labBonuses, 11);
  const thirdLabBonus = getLabBonus(account?.lab?.labBonuses, 110);
  const holeUpg84 = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 84, i: 100 }) || 0;
  const arcadeBonus46 = getArcadeBonus(account?.arcade?.shop, 'Total_Damage')?.bonus ?? 0;
  const accountOpt435 = Number(account?.accountOptions?.[435]) || 0;

  const companion10 = isCompanionBonusActive(account, 10) ? account?.companions?.list?.at(10)?.bonus : 0;
  const companion156 = isCompanionBonusActive(account, 156) ? account?.companions?.list?.at(156)?.bonus : 0;
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Damage');
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet26' ? character?.cards?.cardSet?.bonus : 0;

  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const arenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 2));
  const secondArenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 15));
  const chipBonus = getPlayerLabChipBonus(character, account, 12);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'TotDmg');
  const achievementsBonus = 2 * getAchievementStatus(account?.achievements, 58)
    + 3 * getAchievementStatus(account?.achievements, 59)
    + 5 * getAchievementStatus(account?.achievements, 60)
    + 5 * getAchievementStatus(account?.achievements, 62)
    + 2 * getAchievementStatus(account?.achievements, 119)
    + 3 * getAchievementStatus(account?.achievements, 120)
    + 5 * getAchievementStatus(account?.achievements, 121)
    + 4 * getAchievementStatus(account?.achievements, 189)
    + 2 * getAchievementStatus(account?.achievements, 185)
    + 3 * getAchievementStatus(account?.achievements, 186)
    + 5 * getAchievementStatus(account?.achievements, 187)
    + getAchievementStatus(account?.achievements, 240)
    + getAchievementStatus(account?.achievements, 280)
    + 3 * getAchievementStatus(account?.achievements, 297)
    + 2 * getAchievementStatus(account?.achievements, 303)
    + 2 * getAchievementStatus(account?.achievements, 364)
    + 4 * getAchievementStatus(account?.achievements, 354)
    + 3 * getAchievementStatus(account?.achievements, 375);
  const godBlessing = getGodBlessingBonus(account?.divinity?.deities, 'Flutterbis')
  const secondGodBlessing = getGodBlessingBonus(account?.divinity?.deities, 'Kattlecruk')

  const curseTalent = getTalentBonus(character?.flatTalents, 'CURSE_OF_MR_LOOTY_BOOTY');
  const activeDebuff = getTalentBonusIfActive(character?.activeBuffs, 'BALANCED_SPIRIT');
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Precision', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Fibers_of_Absence', account)?.curse;

  // Pre-softcap damage calculation — each variable is a standalone multiplicative group
  const talentMulti = perWormholeKills * perEquinoxKills;
  const vialMulti = (1 + vialDmgBonus / 100);
  const eclipseMulti = (1 + eclipseSkulls / 100);
  const paletteMulti = (1 + paletteBonus / 100);
  const dreamMulti = (1 + dreamBonus / 10);
  const pristineMulti = (1 + pristineCharmBonus / 100);
  const summoningMulti = (1 + summUpg79 / 100);
  const starSignAndTalentMulti = (1 + (activeBuff + friendBonus
    + (starSignBonus
      + (Math.max(0, unlockedGods - 10) * godTalent
        + Math.floor(Math.max(0, character?.level - 200) / 50) * orbTalent))) / 100);
  const accountBonusMulti = (1 + (grimoireUpg35 + lustreSetBonus + shrineBonus + monumentBonus
    + (postOfficeBonus + (secondPostOfficeBonus + thirdPostOfficeBonus) + amplifiedFamilyBonus)
    + (artifactBonus + (atomBonus + (shinyBonus + (superbitBonus
      + (shimmerBonus + (cropScBonus + vaultUpg41))))))) / 100);
  const bubbleAndStatMulti = (1 + (skillMasteryBonus + strPercBubbleBonus
    + (agiPercBubbleBonus + (wisPercBubbleBonus
      + (secondArtifactBonus + (thirdArtifactBonus
        + (strBubbleBonus * Math.floor(Math.max(strength, luck) / 250)
          + agiBubbleBonus * Math.floor(agility / 250)
          + (wisBubbleBonus * Math.floor(wisdom / 250)
            + (constructMastery + (tomeBonus0 + (compassBonus48
              + (exoticBonus41 + accountOpt419))))))))))) / 100);
  const gearAndLabMulti = (1 + (talentBonus + (saltLickBonus + (equipmentBonus + obolsBonus + prayerBonus))
    + (labBonus + (secondLabBonus + thirdLabBonus)
      + (fourthArtifactBonus + (fifthArtifactBonus
        + (holeUpg84 + (arcadeBonus46 + accountOpt435)))))) / 100);
  const companionAndCardMulti = (1 + ((companion10 ?? 0) + (companion156 ?? 0) + (cardBonus + cardSetBonus)) / 100);
  const arenaAndMiscMulti = (1 + (20 * arenaBonusUnlock + 40 * secondArenaBonusUnlock
    + (chipBonus + mealBonus) + achievementsBonus
    + (godBlessing + secondGodBlessing)) / 100);
  const curseReduction = Math.max((1 - curseTalent / 100) * (1 - activeDebuff / 100)
    * Math.max(.01, 1 - (prayerCurse + secondPrayerCurse) / 100), .05);
  let damage = talentMulti * vialMulti * eclipseMulti * paletteMulti * dreamMulti
    * pristineMulti * summoningMulti * starSignAndTalentMulti * accountBonusMulti
    * bubbleAndStatMulti * gearAndLabMulti * companionAndCardMulti * arenaAndMiscMulti * curseReduction;

  // Minehead multipliers
  const mineheadBonus = getMineheadBonusQTY(account, 0) || 0;
  // WepPowDmgPCT = BonusQTY(4) * weapon's Weapon_Power
  const mineheadUpg4 = getMineheadBonusQTY(account, 4) || 0;
  const weaponWP = (character?.equipment?.[1]?.Weapon_Power || 0);
  const mineheadWepPow = mineheadUpg4 * weaponWP;
  damage *= (1 + mineheadBonus / 100) * (1 + mineheadWepPow / 100);

  // Weekly boss guild bonus
  const weeklyBossBonus = account?.weeklyBossesRaw?.g ?? 0;
  if (weeklyBossBonus > 0) {
    damage *= (1 + Math.min(150, weeklyBossBonus) / 100);
  }

  // === 6-tier softcap chain ===
  if (damage > 100) damage = 100 + Math.max(Math.pow(damage - 100, .86), 0);
  if (damage > 2e7) damage = 2e7 * Math.pow(damage / 2e7, .8);
  if (damage > 5e8) damage = 5e8 * Math.pow(damage / 5e8, .6);
  if (damage > 2e9) damage = 2e9 * Math.pow(damage / 2e9, .45);
  if (damage > 15e9) damage = 15e9 * Math.pow(damage / 15e9, .36);
  if (damage > 6e10) damage = 6e10 * Math.pow(damage / 6e10, .28);

  // === Post-softcap multipliers ===
  const { value: postEquipBonus72 } = getStatsFromGear(character, 72, account);
  const { value: postEquipBonus75 } = getStatsFromGear(character, 75, account);
  const postVoteBonus = getVoteBonus(account, 1) || 0;
  const postSuperbit64 = isSuperbitUnlocked(account, 'Destructive_Gamer') ? 1 : 0;
  const accountOpt232 = 10 * Math.floor((96 + (Number(account?.accountOptions?.[232]) || 0)) / 100);
  const postCardBonus96 = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Damage_(Passive)') || 0;
  const stickerMulti = account?.farming?.dmgMulti ?? 1;
  const tomeBonus6 = account?.tome?.bonuses?.[6]?.bonus || 0;
  const achievePost = getAchievementStatus(account?.achievements, 371) + getAchievementStatus(account?.achievements, 384);
  const killroyMulti = account?.killroy?.totalDamageMulti ?? 1;
  const killroyBonus = Math.max(0, Math.min(2, killroyMulti - 1));

  const postMulti1 = (1 + postEquipBonus72 / 100)
    * (1 + postEquipBonus75 / 100)
    * (1 + postVoteBonus / 100)
    * (1 + 0.1 * postSuperbit64)
    * (1 + accountOpt232 / 100)
    * (1 + postCardBonus96 / 100)
    * Math.max(1, stickerMulti)
    * (1 + (tomeBonus6 + achievePost) / 100)
    * (1 + killroyBonus);
  damage *= postMulti1;

  // Post-softcap companion multiplier
  const companion12 = isCompanionBonusActive(account, 12) ? account?.companions?.list?.at(12)?.bonus ?? 0 : 0;
  const companion33 = isCompanionBonusActive(account, 33) ? account?.companions?.list?.at(33)?.bonus ?? 0 : 0;
  const companion160 = isCompanionBonusActive(account, 160) ? account?.companions?.list?.at(160)?.bonus ?? 0 : 0;
  damage *= Math.max(1, (1 + companion12) * (1 + companion33) * (1 + 2 * companion160));

  // Crystal card, meritocracy
  const crystal6Card = (account?.cards as any)?.cardList?.find?.((c: any) => c?.rawName === 'Crystal6');
  const crystalCardBonus = Math.min(1.5 * (crystal6Card?.stars || 0), 15);
  const meritBonus5 = getMeritocracyBonus(account, 5);
  damage *= (1 + crystalCardBonus / 100) * (1 + meritBonus5 / 100);

  // Bundle bonus
  const hasDmgBundle = isBundlePurchased(account?.bundles, 'bon_a');
  if (hasDmgBundle) damage *= 1.5;

  // Family bonus: TOTAL_DMG_MULTIPLIER (classFamilyBonuses index 40)
  const famBonus80 = getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_DMG_MULTIPLIER', getHighestLevelOf(characters, CLASSES.Elemental_Sorcerer));
  damage *= (1 + famBonus80 / 100);

  // Reliquarium penalty
  const hasReliquarium = (account as any)?.hole?.reliquarium || false;
  if (hasReliquarium) {
    damage = Math.pow(damage, 4 / (5 + (Number(account?.accountOptions?.[473]) || 0)));
  }

  const sources: any[] = [];
  const subSections = [
    {
      name: 'Multiplicative',
      sources: [
        { name: 'Wormhole Emperor', value: (perWormholeKills - 1) * 100 },
        { name: 'Wraith Overlord', value: (perEquinoxKills - 1) * 100 },
        { name: 'Vial (DMG)', value: vialDmgBonus },
        { name: 'Eclipse Skulls', value: eclipseSkulls },
        { name: 'Palette', value: paletteBonus },
        { name: 'Dream', value: dreamBonus },
        { name: 'Pristine Charm', value: pristineCharmBonus },
        { name: 'Summoning Upgrade', value: summUpg79 },
        { name: 'Curse Talent', value: -curseTalent },
        { name: 'Balanced Spirit', value: -activeDebuff },
        { name: 'Prayer Curse (Precision)', value: -prayerCurse },
        { name: 'Prayer Curse (Fibers)', value: -secondPrayerCurse },
        { name: 'Minehead', value: mineheadBonus },
        { name: 'Minehead (WP DMG%)', value: mineheadWepPow },
        { name: 'Weekly Boss', value: weeklyBossBonus },
        { name: 'Equipment (Dmg Multi)', value: postEquipBonus72 },
        { name: 'Equipment (Dmg Bonus)', value: postEquipBonus75 },
        { name: 'Vote Bonus', value: postVoteBonus },
        { name: 'Superbit (Destructive Gamer)', value: postSuperbit64 },
        { name: 'Card (Passive)', value: postCardBonus96 },
        { name: 'Sticker Multi', value: stickerMulti },
        { name: 'Tome', value: tomeBonus6 },
        { name: 'Achievements (Final)', value: achievePost },
        { name: 'Killroy', value: killroyBonus * 100 },
        { name: 'Companion (Ancient Golem)', value: companion12 },
        { name: 'Companion (Chippy)', value: companion33 },
        { name: 'Companion (Glunko)', value: companion160 },
        { name: 'Crystal Card', value: crystalCardBonus },
        { name: 'Meritocracy', value: meritBonus5 },
        { name: 'Bundle', value: hasDmgBundle ? 50 : 0 },
        { name: 'Family (DMG Multi)', value: famBonus80 },
      ]
    },
    {
      name: 'Additive',
      sources: [
        { name: 'No Pain No Gain', value: activeBuff },
        { name: 'Friend Bonus', value: friendBonus },
        { name: 'Star Sign', value: starSignBonus },
        { name: 'Gods Chosen Children', value: Math.max(0, unlockedGods - 10) * godTalent },
        { name: 'Power Orb', value: Math.floor(Math.max(0, character?.level - 200) / 50) * orbTalent },
        { name: 'Grimoire Upgrade', value: grimoireUpg35 },
        { name: 'Lustre Set', value: lustreSetBonus },
        { name: 'Shrine', value: shrineBonus },
        { name: 'Monument', value: monumentBonus },
        { name: 'Post Office (Deaths)', value: postOfficeBonus },
        { name: 'Post Office (Scurvy)', value: secondPostOfficeBonus },
        { name: 'Post Office (Gaming)', value: thirdPostOfficeBonus },
        { name: 'Family', value: amplifiedFamilyBonus },
        { name: 'Crystal Steak', value: artifactBonus },
        { name: 'Atom', value: atomBonus },
        { name: 'Shiny', value: shinyBonus },
        { name: 'Superbit', value: superbitBonus },
        { name: 'Shimmer', value: shimmerBonus },
        { name: 'Crop Depot', value: cropScBonus },
        { name: 'Vault (Bug Power)', value: vaultUpg41 },
        { name: 'Skill Mastery', value: skillMasteryBonus },
        { name: 'Bubble (STR %)', value: strPercBubbleBonus },
        { name: 'Bubble (AGI %)', value: agiPercBubbleBonus },
        { name: 'Bubble (WIS %)', value: wisPercBubbleBonus },
        { name: 'Ruble Cuble', value: secondArtifactBonus },
        { name: 'Fun Hippoete', value: thirdArtifactBonus },
        { name: 'Trione (STR)', value: strBubbleBonus * Math.floor(Math.max(strength, luck) / 250) },
        { name: 'Trione (AGI)', value: agiBubbleBonus * Math.floor(agility / 250) },
        { name: 'Trione (WIS)', value: wisBubbleBonus * Math.floor(wisdom / 250) },
        { name: 'Construction Mastery', value: constructMastery },
        { name: 'Tome', value: tomeBonus0 },
        { name: 'Compass', value: compassBonus48 },
        { name: 'Exotic Market', value: exoticBonus41 },
        { name: 'Gilded Sword', value: talentBonus },
        { name: 'Salt Lick', value: saltLickBonus },
        { name: 'Equipment', value: equipmentBonus },
        { name: 'Obols', value: obolsBonus },
        { name: 'Prayer (Beefy For Real)', value: prayerBonus },
        { name: 'Lab (Animal Farm)', value: labBonus },
        { name: 'Lab (Banking Fury)', value: secondLabBonus },
        { name: 'Lab (Bonus 110)', value: thirdLabBonus },
        { name: 'Opera Mask', value: fourthArtifactBonus },
        { name: 'True Lantern', value: fifthArtifactBonus },
        { name: 'Schematic (Dmg%)', value: holeUpg84 },
        { name: 'Arcade', value: arcadeBonus46 },
        { name: 'Companion (Frog)', value: companion10 ?? 0 },
        { name: 'Companion (Valenslime)', value: companion156 ?? 0 },
        { name: 'Cards', value: cardBonus },
        { name: 'Card Set', value: cardSetBonus },
        { name: 'Arena (3rd Battle Slot)', value: 20 * arenaBonusUnlock },
        { name: 'Arena (4th Battle Slot)', value: 40 * secondArenaBonusUnlock },
        { name: 'Chip', value: chipBonus },
        { name: 'Meal', value: mealBonus },
        { name: 'Achievements', value: achievementsBonus },
        { name: 'God Blessing (Flutterbis)', value: godBlessing },
        { name: 'God Blessing (Kattlecruk)', value: secondGodBlessing },
      ]
    },
  ];

  return { value: damage, sources, subSections };
}

// DamageDealtLIST[1]
const getDamageFromPerX = (character: Character, characters: Character[], account: Account, playerInfo: any, hpMpDamage: number) => {
  // Talent 284 (VEINS_OF_THE_INFERNAL) - Separate multiplier based on smithing level
  const dmgPerSmithing = getTalentBonus(character?.flatTalents, 'VEINS_OF_THE_INFERNAL');
  const smithingLevel = character?.skillsInfo?.smithing?.level || 0;
  const dmgPerSmithingMultiplier = 1 + dmgPerSmithing * (Math.min(100, smithingLevel) / 10) / 100;

  const winnerBonus = getWinnerBonus(account, '<x Total DMG') || 0;

  const choppingScore = getMinigameScore(account, 'chopping');
  // Talent 463 (CHOPPIN_IT_UP_EZ)
  const dmgPerMinigame = getTalentBonus(character?.flatTalents, 'CHOPPIN_IT_UP_EZ', true);
  const dmgPerMinigameBonus = dmgPerMinigame * Math.floor(choppingScore / 25);

  // Bubble bonuses W12, A12, M12
  const bubbleW12 = getBubbleBonus(account, 'DMG_OF_THE_SUN', false);
  const bubbleA12 = getBubbleBonus(account, 'DMG_OF_THE_MOON', false);
  const bubbleM12 = getBubbleBonus(account, 'DMG_OF_THE_SOUL', false);

  // Talent 31 (SKILLAGE_DAMAGE)
  const dmgPerLowestSkill = getTalentBonus(character?.flatTalents, 'SKILLAGE_DAMAGE');
  const lowestSkill = Math.min(...(Object.entries(character?.skillsInfo || {})?.filter(([_, val]: [string, any]) => (val as any).index < 9)
    ?.map(([_, val]: [string, any]) => (val as any).level) || [])) ?? 0;
  const lowestSkillBonus = dmgPerLowestSkill * Math.floor(lowestSkill / 5);

  // Talent 110 (APOCALYPSE_ZOW)
  const dmgPerApoc = getTalentBonus(character?.flatTalents, 'APOCALYPSE_ZOW');
  const zows = character?.zow?.finished?.[0] + 1 || 0;
  const dmgPerApocBonus = dmgPerApoc * zows;

  const monster = monsters?.[character?.targetMonster];
  // Talent 125 (PRECISION_POWER)
  const dmgPerRefinery = getTalentBonus(character?.flatTalents, 'PRECISION_POWER');
  const dmgPerRefineryBonus = playerInfo.accuracy >= monster?.Defence * 2.25
    ? account?.refinery?.totalLevels * dmgPerRefinery
    : 0;


  const greenVials = account?.alchemy?.vials?.reduce((sum: any, { level }: any) => sum + (level > 3 ? 1 : 0), 0);
  // Talent 485 (VIRILE_VIALS)
  const dmgPerVial = getTalentBonus(character?.flatTalents, 'VIRILE_VIALS');
  const dmgPerVialBonus = dmgPerVial * greenVials;

  const items = account?.looty?.lootedItems;
  // Talent 305 (LOOTY_MC_SHOOTY)
  const dmgPerItems = getTalentBonus(character?.flatTalents, 'LOOTY_MC_SHOOTY');
  const dmgPerItemsBonus = dmgPerItems * items / 50;

  const stampsCollected = calcStampCollected(account?.stamps);
  // Talent 470 (PAPERWORK,_GREAT...)
  const dmgPerStamps = getTalentBonus(character?.flatTalents, 'PAPERWORK,_GREAT...');
  const dmgPerStampsBonus = dmgPerStamps * (stampsCollected as number) / 10;

  // Hole engineer upgrade 57 bonus
  const holeUpgrade57Bonus = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 57, i: 0 }) || 0;

  // Talent 290 (SPEEDNA)
  const dmgPerSpeed = getTalentBonus(character?.flatTalents, 'SPEEDNA');
  const speedBonus = playerInfo.movementSpeed / 100 - 1;
  const dmgPerSpeedBonus = dmgPerSpeed * Math.floor(Math.min(speedBonus, 10) / .15);

  // Talent 656 (DREAMER_DAMAGE)
  const dmgPerDream = getTalentBonus(character?.flatTalents, 'DREAMER_DAMAGE');
  const completedDreams = account?.equinox?.completedClouds || 0;
  const dmgPerDreamBonus = dmgPerDream * completedDreams;

  // Talent 649 (FILTHY_DAMAGE)
  const dmgPerGarbage = getTalentBonus(character?.flatTalents, 'FILTHY_DAMAGE');
  const dmgPerGarbageBonus = dmgPerGarbage * lavaLog(account?.accountOptions?.[161] || 0);

  // Talent 638 (DUNGEONIC_DAMAGE)
  const dmgPerDungeonCredits = getTalentBonus(character?.flatStarTalents, 'DUNGEONIC_DAMAGE')
  const dmgPerDungeonCreditsBonus = dmgPerDungeonCredits * lavaLog(account?.accountOptions?.[71]);

  // Talent 658 (QUEST_KAPOW!)
  const questTalent = getTalentBonus(character?.flatStarTalents, 'QUEST_KAPOW!');
  const totalQuestsCompleted = calcTotalQuestCompleted(characters);
  const questBonus = Math.min(totalQuestsCompleted as number, questTalent);

  const hasDoot = isCompanionBonusActive(account, 0);
  const coralKidLinked = Number(account?.accountOptions?.[425]) > 0 && account?.accountOptions?.[425] === 2;
  const minorBonus = hasDoot || coralKidLinked ? getMinorDivinityBonus(character, account, 2) : character?.linkedDeity === 2
    ? character?.deityMinorBonus
    : character?.secondLinkedDeityIndex === 2
      ? character?.secondDeityMinorBonus
      : 0;

  const secondGoldenFoodBonus = getGoldenFoodBonus('Golden_Kebabs', character, account, characters) || 1;

  const damage = hpMpDamage
    * (dmgPerSmithingMultiplier)
    * (1 + winnerBonus / 100) *
    (1 + (dmgPerMinigameBonus
      + (bubbleW12
        + (bubbleA12
          + bubbleM12)
        + lowestSkillBonus
        + dmgPerApocBonus
        + dmgPerRefineryBonus
        + dmgPerVialBonus
        + (dmgPerItemsBonus
          + (dmgPerStampsBonus + holeUpgrade57Bonus))
        + dmgPerSpeedBonus
        + (dmgPerDreamBonus
          + dmgPerGarbageBonus
          + (dmgPerDungeonCreditsBonus
            + questBonus))
        + minorBonus)) / 100)
    * (secondGoldenFoodBonus === 1 ? secondGoldenFoodBonus : 1 + secondGoldenFoodBonus / 100);

  const goldenKebabMulti = secondGoldenFoodBonus === 1 ? 1 : 1 + secondGoldenFoodBonus / 100;
  const sources: any[] = [];
  const subSections = [
    {
      name: 'Multiplicative',
      sources: [
        { name: 'Smithing Talent', value: (dmgPerSmithingMultiplier - 1) * 100 },
        { name: 'Winner Bonus', value: winnerBonus },
        { name: 'Golden Kebabs', value: secondGoldenFoodBonus === 1 ? 0 : secondGoldenFoodBonus },
      ]
    },
    {
      name: 'Additive',
      sources: [
        { name: 'Minigame (Choppin)', value: dmgPerMinigameBonus },
        { name: 'Bubble (DMG of Sun)', value: bubbleW12 },
        { name: 'Bubble (DMG of Moon)', value: bubbleA12 },
        { name: 'Bubble (DMG of Soul)', value: bubbleM12 },
        { name: 'Lowest Skill', value: lowestSkillBonus },
        { name: 'Apocalypse Zow', value: dmgPerApocBonus },
        { name: 'Refinery', value: dmgPerRefineryBonus },
        { name: 'Vials', value: dmgPerVialBonus },
        { name: 'Looty McShooty', value: dmgPerItemsBonus },
        { name: 'Stamps', value: dmgPerStampsBonus },
        { name: 'Schematic (Well Sediment)', value: holeUpgrade57Bonus },
        { name: 'Speed', value: dmgPerSpeedBonus },
        { name: 'Dreams', value: dmgPerDreamBonus },
        { name: 'Garbage', value: dmgPerGarbageBonus },
        { name: 'Dungeon Credits', value: dmgPerDungeonCreditsBonus },
        { name: 'Quests', value: questBonus },
        { name: 'Minor Divinity', value: minorBonus },
      ]
    },
  ];

  let value = 100 < damage ? 100 + Math.max(Math.pow(damage - 100, .86), 0) : damage;
  if (value > 2e6) {
    value = 2e6 * Math.pow(value / 2e6, .5);
  }
  if (value > 1e8) {
    value = 1e8 * Math.pow(value / 1e8, .3);
  }
  return { value, sources, subSections };
}

const getDamageFromHpMp = (character: Character, characters: Character[], account: Account, playerInfo: any, damageFromStat: number) => {
  const secondStatueBonus = getStatueBonus(account, 22, character?.flatTalents);
  const talent113 = 0;
  const hpTalentBonus = getTalentBonus(character?.flatTalents, 'MEAT_SHANK');
  const mpTalentBonus = getTalentBonus(character?.flatTalents, 'OVERCLOCKED_ENERGY');

  const vaultUpgBonus27 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 27) || 0;
  const vaultKillzTotal6 = account?.upgradeVault?.vaultTotalKills?.[6] || 0;
  const vaultUpgBonus15 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 15) || 0;
  const accountOption338 = Number(account?.accountOptions?.[338]) || 0;
  const vaultUpgBonus10 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 10) || 0;

  const bribeBonus30 = account?.bribes?.[30]?.done ? account?.bribes?.[30]?.value : 0;
  const bribeBonus20 = account?.bribes?.[20]?.done ? account?.bribes?.[20]?.value : 0;

  const stampBonus = getStampsBonusByEffect(account, 'Total_Damage', character);
  const landRankBonus = getLandRank(account?.farming?.ranks, 14) || 0;
  const owlBonus = getOwlBonus(account?.owl?.bonuses, 'Total DMG') || 0; // 630 instead of 126
  const kangarooBonus = getKangarooBonus(account?.kangaroo?.bonuses, 'Total DMG') || 0;

  const bubbaRoGBonus = account?.bubba?.bonuses?.totalDamage?.bonus || 0;
  const vaultUpgBonus80 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 80) || 0;

  const sources: any[] = [];
  const subSections = [{
    name: 'Additive',
    sources: [
      { name: 'Damage From Stat', value: Math.pow(damageFromStat, .7) },
      { name: 'Vault (Stick Snapping)', value: vaultUpgBonus27 * vaultKillzTotal6 },
      { name: 'Vault (Knockout!)', value: vaultUpgBonus15 * accountOption338 },
      { name: 'Vault (Weapon Craft)', value: 0.4 * vaultUpgBonus10 },
      { name: 'Bribe (Muscles on Muscles)', value: bribeBonus30 },
      { name: 'Bribe (Photoshopped Dmg)', value: bribeBonus20 },
      { name: 'Stamps', value: stampBonus },
      { name: 'Land Rank', value: landRankBonus },
      { name: 'Statue', value: secondStatueBonus },
      { name: 'HP Talent (Meat Shank)', value: lavaLog(playerInfo.maxHp) * hpTalentBonus },
      { name: 'MP Talent (Overclocked Energy)', value: lavaLog(playerInfo.maxMp) * mpTalentBonus },
      { name: 'Owl', value: owlBonus },
      { name: 'Kangaroo', value: kangarooBonus },
      { name: 'Bubba', value: bubbaRoGBonus },
      { name: 'Vault (Raw Damage)', value: vaultUpgBonus80 },
    ]
  }];

  const value = 1 +
    (Math.pow(damageFromStat, .7)
      + (vaultUpgBonus27 * vaultKillzTotal6
        + vaultUpgBonus15 * accountOption338
        + (0.4 * vaultUpgBonus10 + bribeBonus30)
        + bribeBonus20
        + (stampBonus
          + landRankBonus
          + secondStatueBonus
          + talent113)
        + (lavaLog(playerInfo.maxHp) * hpTalentBonus
          + (lavaLog(playerInfo.maxMp) * mpTalentBonus
            + (owlBonus
              + (kangarooBonus
                + (bubbaRoGBonus
                  + vaultUpgBonus80))))))) / 100;
  return { value, sources, subSections };
}

const getBaseDamage = (character: Character, characters: Character[], account: Account, playerInfo: any, damageFromStat: number) => {
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
  const { value: equipmentBonus } = getStatsFromGear(character, 16, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[16]);
  const statueBonus = getStatueBonus(account, 0, character?.flatTalents);
  const hpBubbleBonus = getBubbleBonus(account, 'BIG_MEATY_CLAWS', false, mainStat === 'strength'); // above 250 HP
  const speedBubble = getBubbleBonus(account, 'QUICK_SLAP', false, mainStat === 'agility'); // works above 110% speed
  const mpBubble = getBubbleBonus(account, 'NAME_I_GUESS', false, mainStat === 'wisdom'); // 150 MP
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_Damage');
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'PLUNGING_SWORD');
  const cosmoBonus = getCosmoBonus({ majik: account?.hole?.holesObject?.idleonMajiks, t: 2, i: 4 });
  const owlBonus = getOwlBonus(account?.owl?.bonuses, 'Base DMG') || 0;
  const vaultUpgBonus0 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 0) || 0;
  const vaultUpgBonus20 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 20) || 0;
  const vaultKillzTotal5 = account?.upgradeVault?.vaultTotalKills?.[5] || 0;

  // "Max" == e | DamageDealtLIST.push
  const weaponPowerEffect = Math.pow(((weaponPower
    * (1 + (strWpTalent
      + agiWpTalent
      + intWpTalent
      + cosmoBonus) / 100))
    + baseWp) / 3, 2)
    + (damageFromStat
      + goldenFoodBonus
      + Math.min(150, 2 * weaponPower
        + damageFromStat))
    + (arcadeBonus +
      (owlBonus
        + (vaultUpgBonus0
          + vaultUpgBonus20
          * vaultKillzTotal5)));

  let damage = weaponPowerEffect
    + (stampsBonus + (equipmentBonus + obolsBonus)
      + statueBonus
      + (postOfficeBonus
        + (hpBubbleBonus
          * lavaLog(Math.max(playerInfo.maxHp - 250, 1))
          + speedBubble
          * (lavaLog2(Math.max((playerInfo.movementSpeed / 100) - 0.1, 0)) / .25)
          + (mpBubble
            * lavaLog(Math.max(playerInfo.maxMp - 150, 1))
            + (cardBonus + sigilBonus)))));
  if (damage > 4e3) {
    damage = 4e3 + Math.max(Math.pow(damage - 4e3, .91), 0);
  }
  if (damage > 15e3) {
    damage = 15e3 + Math.max(Math.pow(damage - 15e3, .84), 0);
  }

  const foodBonus = getFoodBonus(character, account, 'BaseDmgBoosts');
  damage += foodBonus;

  const sources: any[] = [];
  const subSections = [{
    name: 'Additive',
    sources: [
      { name: 'Weapon Power Effect', value: weaponPowerEffect },
      { name: 'Golden Food', value: goldenFoodBonus },
      { name: 'Arcade', value: arcadeBonus },
      { name: 'Owl', value: owlBonus },
      { name: 'Vault (Bigger Damage)', value: vaultUpgBonus0 },
      { name: 'Vault (Slice N Dice)', value: vaultUpgBonus20 * vaultKillzTotal5 },
      { name: 'Stamps', value: stampsBonus },
      { name: 'Equipment', value: equipmentBonus },
      { name: 'Obols', value: obolsBonus },
      { name: 'Statue', value: statueBonus },
      { name: 'Post Office', value: postOfficeBonus },
      { name: 'HP Bubble', value: hpBubbleBonus * lavaLog(Math.max(playerInfo.maxHp - 250, 1)) },
      { name: 'Speed Bubble', value: speedBubble * (lavaLog2(Math.max((playerInfo.movementSpeed / 100) - 0.1, 0)) / .25) },
      { name: 'MP Bubble', value: mpBubble * lavaLog(Math.max(playerInfo.maxMp - 150, 1)) },
      { name: 'Cards', value: cardBonus },
      { name: 'Sigil', value: sigilBonus },
      { name: 'Cosmo', value: cosmoBonus },
      { name: 'Food (post-softcap)', value: foodBonus },
    ]
  }];

  return { baseDamage: damage, sources, subSections };
}

const getAccuracy = (character: Character, characters: Character[], account: Account, movementSpeed: number) => {
  // _customBlock_PlayerAccTot = function
  const accuracyStats = {
    'strength': 'wisdom',
    'agility': 'strength',
    'wisdom': 'agility',
    'luck': 'luck'
  }
  const mainStat = mainStatMap?.[character?.class];
  const accuracyStat = (accuracyStats as Record<string, any>)?.[mainStat];

  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'baseACC');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Box_of_Unwanted_Stats', 0);
  const baseCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_accuracy');
  const { value: equipmentBonus } = getStatsFromGear(character, 28, account);
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
  const companionBonus23 = isCompanionBonusActive(account, 23) ? account?.companions?.list?.at(23)?.bonus : 0;
  const tipToeQuickness = getTalentBonus(character?.flatStarTalents, 'TIPTOE_QUICKNESS', true);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Precision', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Beefy_For_Real', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Pain', account)?.curse;
  const chipBonus = getPlayerLabChipBonus(character, account, 2);

  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'TotAcc');
  const kangarooBonus = getKangarooBonus(account?.kangaroo?.bonuses, 'Accuracy') || 0;
  const voteBonus = getVoteBonus(account, 3) || 0;
  const amarokSetBonus = getArmorSetBonus(account, 'AMAROK_SET') || 0;
  const hasDoot = isCompanionBonusActive(account, 0);
  const minorBonus = hasDoot ? getMinorDivinityBonus(character, account, 0) : character?.linkedDeity === 0
    ? character?.deityMinorBonus
    : 0;

  let accuracy = (character?.stats as any)?.[accuracyStat]
    * (1 + bubbleBonus / 100) *
    (1 + (activeBuff + (cardBonus
      + (starSignBonus
        + (secondActiveBuff + (statueBonus
          + (arcadeBonus + (flurboBonus + (bribeBonus + (companionBonus23 ?? 0))))))))) / 100);
  if ((movementSpeed / 100) > 1.99) {
    accuracy *= (1 + tipToeQuickness / 100);
  }
  accuracy = (Math.pow(accuracy / 4, 1.4)
    + (accuracy + baseAccuracy))
    * (1 + (accuracy + 2 * cardSetBonus) / 200)
    * Math.max(0.1, 1 + (prayerBonus - prayerCurse - secondPrayerCurse) / 100)
    * (1 + (chipBonus + mealBonus + kangarooBonus + voteBonus + amarokSetBonus) / 100) * (1 + minorBonus / 100)
  return accuracy;
}
const getMaxMp = (character: Character, characters: Character[], account: Account) => {
  // customBlock_PlayerMPmax
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_MP');
  const cardPercentBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_MP');
  const mpBubble = 0; // doesn't exist
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
const getMaxHp = (character: Character, characters: Character[], account: Account) => {
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

  const { value: equipmentBonus } = getStatsFromGear(character, 15, account);
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
const getWeaponPower = (character: Character, characters: Character[], account: Account) => {
  // "Weapon_Power" ==
  const mainStat = mainStatMap?.[character?.class];
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Deaths_Storage_Unit', 0);
  const flurbo = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Weapon_Power');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Weapon_Power');
  const cardPassiveBonus = getCardBonusByEffect(account?.cards, 'Weapon_Power_(Passive)')
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 3);
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'DUSTER_STUDS');
  // Tool Weapon_Power is skill power (Choppin/Mining/etc.), not combat WP
  const { value: equipmentBonus } = getStatsFromGear(character, 'Weapon_Power', account, true);
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
const getCritDamage = (character: Character, characters: Character[], account: Account) => {
  // customBlock_CritDamage
  const mainStat = mainStatMap?.[character?.class];
  const wisTalentBonus = getTalentBonus(character?.flatTalents, 'FARSIGHT', true);
  const warTalentBonus = getTalentBonus(character?.flatTalents, 'CRITIKILL');
  const begTalentBonus = getTalentBonus(character?.flatTalents, 'KNUCKLEBUSTER');
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'DIVINE_INTERVENTION');
  const bubbleBonus = getBubbleBonus(account, 'BAPPITY_BOOPITY', false, mainStat === 'strength');
  const stampBonus = getStampsBonusByEffect(account, 'Critical_Damage');
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Critical_Damage');
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Circular_Criticals', account)?.curse;
  const { value: equipmentBonus } = getStatsFromGear(character, 22, account);
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
const getCritChance = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
  // customBlock_CritChance
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
  const { value: equipmentBonus } = getStatsFromGear(character, 23, account);
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
const getHitChance = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
  const monster = monsters?.[character?.targetMonster];
  const effectiveAccuracy = playerInfo?.accuracy / monster?.Defence;
  return .5 <= effectiveAccuracy ?
    Math.floor(Math.min(100 * (.95 * effectiveAccuracy - .425), 100)) : 0;
}
const getKillsPerHour = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
  const dEffect = getTalentEffectOnKills(character, account, 'D');
  const kEffect = getTalentEffectOnKills(character, account, 'K');
  const mainStat = mainStatMap?.[character?.class];
  const charWeapon = character?.equipment?.[1]?.Speed || 0;
  const { value: equipmentBonus } = getStatsFromGear(character, 56, account);
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
const getTalentEffectOnKills = (character: Character, account: Account, stat: 'D' | 'K') => {
  // customBlock_afkAttackBonses
  const mainStat = mainStatMap?.[character?.class];
  const effect = character?.talentsLoadout?.reduce((sum: any, talent: any) => {
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

const getMonsterHpTotal = (baseHp: number, character: Character, account: Account) => {
  // performETCaction: MonsterHPTotal
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Big_Brain_Time', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Midas_Minded', account)?.curse;
  const thirdPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Jawbreaker', account)?.curse;

  return baseHp * (1 + (prayerCurse + (secondPrayerCurse + thirdPrayerCurse)) / 100);
}

const getSurvivability = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
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

const getMonsterDamage = (monster: any, character: Character, account: Account, playerInfo: any) => {
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

const getPlayerDefence = (character: Character, characters: Character[], account: Account, _unused3?: any) => {
  // "Defence" == e
  const mainStat = mainStatMap?.[character?.class];
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Box_of_Unwanted_Stats', 1);
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet4' ? character?.cards?.cardSet?.bonus : 0;
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Base_Defence');
  const secondCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Defence_from_Equipment');
  const bubbleBonus = getBubbleBonus(account, 'FMJ', false, mainStat === 'strength');
  const stampBonus = getStampsBonusByEffect(account, 'Base_Defence');
  const { value: gearBonus } = getStatsFromGear(character, 'Defence', account);
  const obolsBonus = getObolsBonus(character?.obols, 'Defence');
  const { value: equipmentBonusEtc } = getStatsFromGear(character, 50, account);
  const obolsBonusEtc = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[50]);
  const { value: secondEquipmentBonusEtc } = getStatsFromGear(character, 7, account);
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
  const coralKidLinked = account?.accountOptions?.[425] === 0;

  // Missing bonuses from obfuscated code
  const vaultUpgBonus46 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 46) || 0;
  const companionBonus21 = isCompanionBonusActive(account, 21) ? account?.companions?.list?.at(21)?.bonus : 0;
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'DEF_from_Equips_(Passive)');
  const amarokSetBonus = getArmorSetBonus(account, 'AMAROK_SET') || 0;
  const rooBonus1 = getKangarooBonus(account?.kangaroo?.bonuses, 'Defence') || 0;
  const vaultUpgBonus5 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 5) || 0;
  const voteBonus3 = getVoteBonus(account, 3) || 0;

  const minorBonus = hasDoot || coralKidLinked ? getMinorDivinityBonus(character, account, 0) : character?.linkedDeity === 0
    ? character?.deityMinorBonus
    : 0;

  // gearBonus now includes gallery and hatRack bonuses
  const value = Math.floor((postOfficeBonus
    + cardBonus + Math.min(character?.level,
      bubbleBonus)
    + (stampBonus
      + (equipmentBonusEtc + obolsBonusEtc)
      + arcadeBonus
      + statueBonus)
    + ((gearBonus + obolsBonus)
      * (1 + (bubbleBonus + vaultUpgBonus46 + secondCardBonus + companionBonus21 + passiveCardBonus) / 100)
      + (mealBonus + talentBonus)))
    * (1 + (shrineBonus + bribeBonus) / 100)
    * Math.max(0.05, 1 - (prayerCurse + secondPrayerCurse) / 100)
    * (1 + (goldenFoodBonus + secondTalentBonus +
      ((secondEquipmentBonusEtc + secondObolsBonus) + (starSignBonus
        + (activeBuff + (cardSetBonus + (flurboBonus
          + chipBonus + amarokSetBonus)))))) / 100) * (1 + (minorBonus + voteBonus3) / 100)
    + rooBonus1 + vaultUpgBonus5);

  const breakdown = {
    statName: "Defence",
    totalValue: notateNumber(value),
    categories: [
      {
        name: "Additive",
        sources: [
          { name: "Post Office", value: postOfficeBonus },
          { name: "Card Bonus", value: cardBonus + secondCardBonus + passiveCardBonus },
          { name: "Cardset Bonus", value: cardSetBonus },
          { name: "Flurbo Bonus", value: flurboBonus },
          { name: "Minor Divinity Bonus", value: minorBonus },
          { name: "Vote Bonus", value: voteBonus3 },
          { name: "Chip Bonus", value: chipBonus },
          { name: "Bubble Bonus", value: bubbleBonus },
          { name: "Vault", value: vaultUpgBonus46 + vaultUpgBonus5 },
          { name: "Companion", value: companionBonus21 },
          { name: "Amarok Set Bonus", value: amarokSetBonus },
          { name: "Roo Bonus", value: rooBonus1 },
          { name: "Stamp Bonus", value: stampBonus },
          { name: "Equip Base Defence", value: equipmentBonusEtc + obolsBonusEtc },
          { name: "Equip Defence", value: gearBonus + obolsBonus },
          { name: "Equip % Defence", value: secondEquipmentBonusEtc + secondObolsBonus },
          { name: "Arcade Bonus", value: arcadeBonus },
          { name: "Statue Bonus", value: statueBonus },
          { name: "Meal Bonus", value: mealBonus },
          { name: "Shrine Bonus", value: shrineBonus },
          { name: "Bribe Bonus", value: bribeBonus },
          { name: "Prayers", value: prayerCurse + secondPrayerCurse },
          { name: "Golden Food", value: goldenFoodBonus },
          { name: "Talents Bonus", value: talentBonus + secondTalentBonus },
          { name: "Active Talents Bonus", value: activeBuff },
        ],
      },
    ]
  };

  return {
    value,
    breakdown
  }
}

const getKillPerKill = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
  const { value: equipmentBonus } = getStatsFromGear(character, 68, account);
  const { value: secondEquipmentBonus } = getStatsFromGear(character, 69, account);
  const { value: thirdEquipmentBonus } = getStatsFromGear(character, 70, account);
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

const getMultiKillTotal = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
  const starSignBonus = getStarSignBonus(character, account, 'Total_Multikill');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 8);
  const stampsBonus = getStampsBonusByEffect(account, 'Base_Overkill')
  const { value: equipmentBonus } = getStatsFromGear(character, 29, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[29]);
  const monster = monsters?.[character?.targetMonster];
  const monsterHp = getMonsterHpTotal(monster?.MonsterHPTotal, character, account);
  let multiKills = 1;
  for (let i = 0; i < 50; i++) {
    if (playerInfo?.maxDamage >= (2 * monsterHp * Math.pow(2, i + 1))) {
      multiKills = i + 2;
    }
  }
  if (playerInfo) playerInfo.multiKillTiers = multiKills;
  const deathNoteRank = account?.deathNote?.[Math.floor(character?.mapIndex / 50)]?.rank || 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'Overkill');
  const activeBuff = getTalentBonusIfActive(character?.activeBuffs, 'VOID_RADIUS');
  const voidTalentBonus = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'MASTER_OF_THE_SYSTEM', false, false, false, false, character);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Multikill_per_Tier')?.bonus ?? 0;
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Trilobite_Rock')?.bonus ?? 0;
  const secondActiveBuff = getTalentBonusIfActive(character?.activeBuffs, 'MANA_IS_LIFE', 'y');
  const chipBonus = getPlayerLabChipBonus(character, account, 14);
  const { value: secondEquipmentBonus } = getStatsFromGear(character, 71, account);
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
          * Math.floor(Number(account?.accountOptions?.[158]) / 5))
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