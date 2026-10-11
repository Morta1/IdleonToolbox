import type { Account, Character } from './types';
import { CLASSES, getTalentBonus, getTalentBonusIfActive, mainStatMap, getHighestTalentAcrossCharacters } from './talents';
import { getPostOfficeBonus } from './world-3/postoffice';
import { getDungeonFlurboStatBonus } from './dungeons';
import { getCardBonusByEffect } from './cards';
import { getGuildBonusBonus } from './guild';
import { getActiveBubbleBonus, getBubbleBonus, getSigilBonus, getVialsBonusByStat } from './world-2/alchemy';
import { getStatsFromGear } from './items';
import { getObolsBonus } from './obols';
import { bonuses, mapDetails, monsters, randomList } from '@website-data';
import {
  getFoodBonus,
  getGoldenFoodBonus,
  getGoldenFoodMultiplier,
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
import { calcTotalOnyx, getStatueBonus } from './world-1/statues';
import { calcStampCollected, getStampsBonusByEffect, getStampsBonusByStat } from './world-1/stamps';
import { lavaLog, lavaLog2 } from '@utility/helpers';
import { hitChance, hitCurveOf } from '@utility/hit-chance.mjs';
import { getShrineBonus } from './world-3/shrines';
import { getPrayerBonusAndCurse } from './world-3/prayers';
import { getLabBonus, getJewelBonus, getPlayerLabChipBonus } from './world-4/lab';
import { getMealsBonusByEffectOrStat } from './world-4/cooking';
import { getEclipseSkullsBonus } from './world-3/deathNote';
import { isArtifactAcquired } from './world-5/sailing';
import { getAtomBonus } from './world-3/atomCollider';
import { getShinyBonus } from './world-4/breeding';
import { isSuperbitUnlocked } from './world-5/gaming';
import { constructionMasteryThresholds } from './world-3/construction';
import { getSaltLickBonus } from './world-3/saltLick';
import { getAchievementStatus } from './achievements';
import { getCharacterMinorDivinityBonus, getGodBlessingBonus, GOD_INDEX, isMajorDivinityActive } from './world-5/divinity';
// getEquinoxBonus not used - AdditionExtraDMG uses talent-based calculation
import { getMiningEff } from '@parsers/efficiency';
import { getUpgradeVaultBonus } from './misc/upgradeVault';
import { getOwlBonus } from './world-1/owl';
import { getKangarooBonus } from './world-2/kangaroo';
import { getVoteBonus } from './world-2/voteBallot';
import { getLandRank, getExoticMarketBonus } from './world-6/farming';
import { getWinnerBonus, getSummoningUpgradeBonus } from './world-6/summoning';
import { getSchematicBonus } from './world-5/caverns/the-well';
import { calcTotalQuestCompleted, getAdviceFishBonus, getFriendBonus } from './misc';
import { getArmorSetBonus } from './world-3/armorSmithy';
import { getCosmoBonus, getMeasurementBonus } from './world-5/hole';
import { getPaletteBonus } from './world-5/gaming';
import { getCharmBonus } from './world-6/sneaking';
import { getGrimoireBonus } from './class-specific/grimoire';
import { getMonumentBonus } from './world-5/caverns/bravery';
import { getCompassBonus } from './class-specific/compass';
import { getMeritocracyBonus } from './world-2/voteBallot';
import { getMineheadBonusQTY } from './world-7/minehead';
import { getSushiBonus } from './world-7/sushiStation';
import { getJellyBonus } from './world-7/jellyOperator';
import { getLegendTalentBonus } from './world-7/legendTalents';
import { isBundlePurchased } from './misc';
import { getFountainBonusTotal } from './world-5/caverns/the-fountain';
import { getCglunkoBonus } from './world-5/caverns/crystal-glunko-cove';
import { notateNumber } from '@utility/helpers';
import { getSpelunkingBonus } from './world-7/spelunking';
import { getRoyalStatueBonus } from './class-specific/royalGuardian';
import { additiveGroup, createBreakdown, flat, multiplier, percent, productGroup, softcapLine, sumGroup } from './breakdown';
import type { BreakdownNode } from './breakdown';
import { getCharacterFamilyBonus } from './family';

// The speedrun route re-runs this once per map with only mapIndex/targetMonster changed, so the
// map-invariant stats can be computed once and passed back in via `shared` (one object per
// character variant). Everything touching the map or its monster - maxHp (shrines), crit chance,
// hit chance, the damage components reading them, respawn, kills per hour - stays per-call.
export const getMaxDamage = (character: Character, characters: Character[], account: Account, shared?: any) => {
  const playerInfo: any = { survivabilityMath: 0 };
  if (!shared || !shared.invariants) {
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
    const movementSpeed = getPlayerSpeedBonus(character, characters, account);
    const invariants = {
      damageFromStat,
      maxMp: getMaxMp(character, characters, account),
      movementSpeed,
      accuracy: getAccuracy(character, characters, account, movementSpeed),
      critDamage: getCritDamage(character, characters, account),
      mastery: getMastery(character, characters, account)
    };
    if (shared) shared.invariants = invariants;
    playerInfo.invariants = invariants;
  }
  const { damageFromStat, ...invariantStats } = shared?.invariants ?? playerInfo.invariants;
  delete playerInfo.invariants;

  const { respawnRate } = getRespawnRate(character, account);
  playerInfo.respawnRate = respawnRate;
  const { afkGains } = getAfkGain(character, characters, account);
  playerInfo.afkGains = afkGains;
  // null means the character has no AFK target, so it earns nothing per hour
  const afkGainsRate = afkGains ?? 0;
  playerInfo.maxHp = getMaxHp(character, characters, account);
  playerInfo.maxMp = invariantStats.maxMp;
  playerInfo.movementSpeed = invariantStats.movementSpeed;
  playerInfo.accuracy = invariantStats.accuracy;
  playerInfo.critDamage = invariantStats.critDamage;
  playerInfo.critChance = getCritChance(character, characters, account, playerInfo);
  playerInfo.hitChance = getHitChance(character, characters, account, playerInfo);
  playerInfo.mastery = invariantStats.mastery;

  // efficiencies
  playerInfo.miningEff = getMiningEff(character, characters, account, playerInfo);

  const { baseDamage, node: baseNode } = getBaseDamage(character, characters, account, playerInfo, damageFromStat)
  const { value: hpMpDamage, node: hpMpNode } = getDamageFromHpMp(character, characters, account, playerInfo, damageFromStat);
  const { value: perDamage, node: perXNode } = getDamageFromPerX(character, characters, account, playerInfo, hpMpDamage, hpMpNode);
  const { value: percentDamage, node: percentNode } = getDamagePercent(character, characters, account, playerInfo);
  playerInfo.maxDamage = baseDamage * perDamage * percentDamage;
  playerInfo.minDamage = playerInfo.mastery * playerInfo.maxDamage;
  // Max damage is the product of the three
  playerInfo.damageBreakdown = createBreakdown('Damage', notateDamage(playerInfo)[0], [baseNode, perXNode, percentNode]);
  playerInfo.defence = getPlayerDefence(character, characters, account, playerInfo);
  playerInfo.survivability = getSurvivability(character, characters, account, playerInfo);
  playerInfo.killsPerHour = getKillsPerHour(character, characters, account, playerInfo);
  playerInfo.survivabilityMath = playerInfo.killsPerHour * afkGainsRate * (playerInfo.survivability / 100);
  playerInfo.survivability = getSurvivability(character, characters, account, playerInfo);
  playerInfo.killsPerHour = getKillsPerHour(character, characters, account, playerInfo);

  playerInfo.killPerkill = getKillPerKill(character, characters, account, playerInfo);

  playerInfo.finalKillsPerHour = Math.floor(playerInfo.killsPerHour * afkGainsRate * (playerInfo.survivability / 100) * playerInfo.killPerkill.value);

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

// The damage curses together never cut damage below this factor
const MIN_DAMAGE_CURSE_MULTI = .05;
const DMG_BUNDLE_MULTI = 1.5;

const getDamagePercent = (character: Character, characters: Character[], account: Account, _unused3?: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const { strength, agility, wisdom, luck } = character?.stats || {};

  // === Pre-softcap bonuses (game DamageDealtLIST[2] initial push) ===
  // Game: WorkbenchStuff('AdditionExtraDMG') uses highest talent across ALL characters
  // (1 + talent508 * log(opt152) / 100) * (1 + talent208 * log(opt329) / 100)
  const wormHoleTalent = getHighestTalentAcrossCharacters(characters, 'WORMHOLE_EMPEROR', character);
  const perWormholeKills = 1 + (wormHoleTalent * lavaLog(Number(account?.accountOptions?.[152]) || 0)) / 100;
  // Talent 208 = WRAITH_OVERLORD - available on Death_Bringer (Warrior path)
  const wraithOverlordTalent = getHighestTalentAcrossCharacters(characters, 'WRAITH_OVERLORD', character);
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
  const godTalent = getHighestTalentAcrossCharacters(characters, 'GODS_CHOSEN_CHILDREN', character);
  const orbTalent = getHighestTalentAcrossCharacters(characters, 'POWER_ORB', character);
  const friendBonus = getFriendBonus(account, 0);

  const grimoireUpg35 = getGrimoireBonus(account?.grimoire?.upgrades, 35);
  const lustreSetBonus = getArmorSetBonus(account, 'LUSTRE_SET') || 0;
  const shrineBonus = getShrineBonus(account?.shrines, 0, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 6 }) || 0;
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Deaths_Storage_Unit', 2);
  const secondPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Scurvy_C\'arr\'ate', 2);
  const thirdPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Gaming_Lootcrate', 2);

  // FamBonusQTYs[20], as the played character sees it
  const amplifiedFamilyBonus = getCharacterFamilyBonus(character, CLASSES.Blood_Berserker);

  const firstArtifact = isArtifactAcquired(account?.sailing?.artifacts, 'Crystal_Steak');
  const artifactBonus = firstArtifact?.additionalData?.[character?.playerId]?.bonus ?? 0;
  const secondArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Ruble_Cuble')?.bonus ?? 0;
  const thirdArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Fun_Hippoete')?.bonus ?? 0;
  const fourthArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Opera_Mask')?.bonus ?? 0;
  const fifthArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'The_True_Lantern')?.bonus ?? 0;

  const atomBonus = getAtomBonus(account, 'Neon_-_Damage_N\'_Cheapener') ?? 0;
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
  // Lab 110 = jewel 10 bonus, doubled if adjacent jewels 7,8,9 are all active
  const jewel10Base = getJewelBonus(account?.lab?.jewels, 10);
  const jewel10Doubled = [7, 8, 9].every(i => getJewelBonus(account?.lab?.jewels, i) > 0) ? 2 : 1;
  const thirdLabBonus = jewel10Base * jewel10Doubled;
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
  const secondGodBlessing = getGodBlessingBonus(account?.divinity?.deities, 'Kattlekruk')

  const curseTalent = getTalentBonus(character?.flatTalents, 'CURSE_OF_MR_LOOTY_BOOTY');
  const activeDebuff = getTalentBonusIfActive(character?.activeBuffs, 'BALANCED_SPIRIT');
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Precision', account)?.curse;
  const secondPrayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Fibers_of_Absence', account)?.curse;

  // Pre-softcap damage calculation - each variable is a standalone multiplicative group
  const talentMulti = perWormholeKills * perEquinoxKills;
  const vialMulti = (1 + vialDmgBonus / 100);
  const eclipseMulti = (1 + eclipseSkulls / 100);
  const paletteMulti = (1 + paletteBonus / 100);
  const dreamMulti = (1 + dreamBonus / 10);
  const pristineMulti = (1 + pristineCharmBonus / 100);
  const summoningMulti = (1 + summUpg79 / 100);
  // Game DamageDealed/Max: * (1 + Holes2("Cglunko_upgBon", 19) / 100) - Crystal Glunko Cove damage upgrade
  const glunkoDmgBonus = getCglunkoBonus(account, 19);
  const glunkoDmgMulti = (1 + glunkoDmgBonus / 100);
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
    * Math.max(.01, 1 - (prayerCurse + secondPrayerCurse) / 100), MIN_DAMAGE_CURSE_MULTI);
  let damage = talentMulti * vialMulti * eclipseMulti * paletteMulti * dreamMulti
    * pristineMulti * summoningMulti * glunkoDmgMulti * starSignAndTalentMulti * accountBonusMulti
    * bubbleAndStatMulti * gearAndLabMulti * companionAndCardMulti * arenaAndMiscMulti * curseReduction;

  // Minehead multipliers
  const mineheadBonus = getMineheadBonusQTY(account, 0) || 0;
  // WepPowDmgPCT = BonusQTY(4) * weapon's Weapon_Power
  const mineheadUpg4 = getMineheadBonusQTY(account, 4) || 0;
  const weaponWP = (character?.equipment?.[1]?.Weapon_Power || 0);
  const mineheadWepPow = mineheadUpg4 * weaponWP;
  // Royal Statue 0 (TOTAL DAMAGE) - returns 0 for accounts with no Royal Guardian.
  const royalStatueDmgBonus = getRoyalStatueBonus(account, 0);
  const jellyDmgBonus = getJellyBonus(account, 37);
  damage *= (1 + mineheadBonus / 100) * (1 + mineheadWepPow / 100) * (1 + jellyDmgBonus / 100)
    * (1 + royalStatueDmgBonus / 100);

  // Weekly boss guild bonus
  const weeklyBossBonus = account?.weeklyBossesRaw?.g ?? 0;
  const weeklyBossMulti = weeklyBossBonus > 0 ? (1 + Math.min(150, weeklyBossBonus) / 100) : 1;
  if (weeklyBossBonus > 0) {
    damage *= weeklyBossMulti;
  }
  const beforeSoftcap = damage;

  // === 6-tier softcap chain ===
  if (damage > 100) damage = 100 + Math.max(Math.pow(damage - 100, .86), 0);
  if (damage > 2e7) damage = 2e7 * Math.pow(damage / 2e7, .8);
  if (damage > 5e8) damage = 5e8 * Math.pow(damage / 5e8, .6);
  if (damage > 2e9) damage = 2e9 * Math.pow(damage / 2e9, .45);
  if (damage > 15e9) damage = 15e9 * Math.pow(damage / 15e9, .36);
  if (damage > 6e10) damage = 6e10 * Math.pow(damage / 6e10, .28);
  const afterSoftcap = damage;

  // === Post-softcap multipliers ===
  // Game uses EtcBonuses("72") and EtcBonuses("75") - mapped via IDforETCbonus to
  // %_DAMAGE_MULTI and %_DAMAGE_BONUS respectively. TotalStatsETCmap aggregates from
  // equipment, gallery trophies, nametags, and premium hats (NOT obols).
  const { value: postEtcBonus72 } = getStatsFromGear(character, 72, account);
  const { value: postEtcBonus75 } = getStatsFromGear(character, 75, account);
  const { value: postEtcBonus104 } = getStatsFromGear(character, 104, account);
  const postVoteBonus = getVoteBonus(account, 1) || 0;
  const postSuperbit64 = isSuperbitUnlocked(account, 'Destructive_Gamer') ? 1 : 0;
  const accountOpt232 = 10 * Math.floor((96 + (Number(account?.accountOptions?.[232]) || 0)) / 100);
  const postCardBonus96 = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Damage_(Passive)') || 0;
  const stickerMulti = account?.farming?.dmgMulti ?? 1;
  const tomeBonus6 = account?.tome?.bonuses?.[6]?.bonus || 0;
  const achievePost = getAchievementStatus(account?.achievements, 371) + getAchievementStatus(account?.achievements, 384);
  const killroyMulti = account?.killroy?.totalDamageMulti ?? 1;
  const killroyBonus = Math.max(0, Math.min(2, killroyMulti - 1));

  const fountainSwingyBonus = getFountainBonusTotal(account?.hole?.holesObject, 1, 16);
  const sushiDmgBonus = getSushiBonus(account, 49);
  const postMulti1 = (1 + postEtcBonus72 / 100)
    * (1 + postEtcBonus75 / 100)
    * (1 + postEtcBonus104 / 100)
    * (1 + postVoteBonus / 100)
    * (1 + fountainSwingyBonus / 100)
    * (1 + 0.1 * postSuperbit64)
    * (1 + accountOpt232 / 100)
    * (1 + postCardBonus96 / 100)
    * Math.max(1, stickerMulti)
    * (1 + (tomeBonus6 + achievePost) / 100)
    * (1 + killroyBonus)
    * (1 + sushiDmgBonus / 100);
  damage *= postMulti1;

  // Post-softcap companion multiplier
  const companion12 = isCompanionBonusActive(account, 12) ? account?.companions?.list?.at(12)?.bonus ?? 0 : 0;
  const companion33 = isCompanionBonusActive(account, 33) ? account?.companions?.list?.at(33)?.bonus ?? 0 : 0;
  const companion160 = isCompanionBonusActive(account, 160) ? account?.companions?.list?.at(160)?.bonus ?? 0 : 0;
  const companion168 = isCompanionBonusActive(account, 168) ? account?.companions?.list?.at(168)?.bonus ?? 0 : 0;
  // Companion 170 = Magician_Grub (new raid pet): base 0.25 -> 1.25x, upgraded 0.35 -> 1.35x total damage.
  const companion170 = isCompanionBonusActive(account, 170) ? account?.companions?.list?.at(170)?.bonus ?? 0 : 0;
  damage *= Math.max(1, (1 + companion12) * (1 + companion33) * (1 + 2 * companion160) * (1 + 0.5 * companion168) * (1 + companion170));

  // Crystal card, meritocracy
  // Game: min(1.5 * CardLv("Crystal6"), 15) - CardLv is 1-based star level
  const crystal6Card: any = Object.values(account?.cards ?? {}).find((c: any) => c?.rawName === 'Crystal6');
  const crystalCardBonus = Math.min(1.5 * (crystal6Card?.amount > 0 ? (crystal6Card?.stars ?? 0) + 1 : 0), 15);
  const meritBonus5 = getMeritocracyBonus(account, 5);
  damage *= (1 + crystalCardBonus / 100) * (1 + meritBonus5 / 100);

  // Bundle bonus
  const hasDmgBundle = isBundlePurchased(account?.bundles, 'bon_a');
  if (hasDmgBundle) damage *= DMG_BUNDLE_MULTI;

  // Family bonus: FamBonusQTYs[80]. The DNSM key is 2 * classIndex + I, so 80 is classFamilyBonuses[40],
  // the Arcane Cultist. Elemental Sorcerer is class 34 and gives added talent levels instead.
  const famBonus80 = getCharacterFamilyBonus(character, CLASSES.Arcane_Cultist);
  damage *= (1 + famBonus80 / 100);

  // Reliquarium penalty
  const hasReliquarium = (account as any)?.hole?.reliquarium || false;
  const beforeReliquarium = damage;
  if (hasReliquarium) {
    damage = Math.pow(damage, 4 / (5 + (Number(account?.accountOptions?.[473]) || 0)));
  }

  const node = productGroup('Damage %', [
    multiplier('Wormhole Emperor', perWormholeKills),
    multiplier('Wraith Overlord', perEquinoxKills),
    multiplier('Vial (DMG)', vialMulti),
    multiplier('Eclipse Skulls', eclipseMulti),
    multiplier('Palette', paletteMulti),
    multiplier('Dream', dreamMulti),
    multiplier('Pristine Charm', pristineMulti),
    multiplier('Summoning Upgrade', summoningMulti),
    multiplier('Crystal Glunko Cove', glunkoDmgMulti),
    additiveGroup('Talents, star sign and friend', [
      percent('No Pain No Gain', activeBuff),
      percent('Friend Bonus', friendBonus),
      percent('Star Sign', starSignBonus),
      percent('Gods Chosen Children', Math.max(0, unlockedGods - 10) * godTalent),
      percent('Power Orb', Math.floor(Math.max(0, character?.level - 200) / 50) * orbTalent)
    ]),
    additiveGroup('Account bonuses', [
      percent('Grimoire Upgrade', grimoireUpg35),
      percent('Lustre Set', lustreSetBonus),
      percent('Shrine', shrineBonus),
      percent('Monument', monumentBonus),
      percent('Post Office (Deaths)', postOfficeBonus),
      percent('Post Office (Scurvy)', secondPostOfficeBonus),
      percent('Post Office (Gaming)', thirdPostOfficeBonus),
      percent('Family', amplifiedFamilyBonus),
      percent('Crystal Steak', artifactBonus),
      percent('Atom', atomBonus),
      percent('Shiny', shinyBonus),
      percent('Superbit', superbitBonus),
      percent('Shimmer', shimmerBonus),
      percent('Crop Depot', cropScBonus),
      percent('Vault (Bug Power)', vaultUpg41)
    ]),
    additiveGroup('Bubbles, stats and mastery', [
      percent('Skill Mastery', skillMasteryBonus),
      percent('Bubble (STR %)', strPercBubbleBonus),
      percent('Bubble (AGI %)', agiPercBubbleBonus),
      percent('Bubble (WIS %)', wisPercBubbleBonus),
      percent('Ruble Cuble', secondArtifactBonus),
      percent('Fun Hippoete', thirdArtifactBonus),
      percent('Trione (STR)', strBubbleBonus * Math.floor(Math.max(strength, luck) / 250)),
      percent('Trione (AGI)', agiBubbleBonus * Math.floor(agility / 250)),
      percent('Trione (WIS)', wisBubbleBonus * Math.floor(wisdom / 250)),
      percent('Construction Mastery', constructMastery),
      percent('Tome', tomeBonus0),
      percent('Compass', compassBonus48),
      percent('Exotic Market', exoticBonus41),
      percent('Account Option (419)', accountOpt419)
    ]),
    additiveGroup('Gear, lab and artifacts', [
      percent('Gilded Sword', talentBonus),
      percent('Salt Lick', saltLickBonus),
      percent('Equipment', equipmentBonus),
      percent('Obols', obolsBonus),
      percent('Prayer (Beefy For Real)', prayerBonus),
      percent('Lab (Animal Farm)', labBonus),
      percent('Lab (Banking Fury)', secondLabBonus),
      percent('Lab (Bonus 110)', thirdLabBonus),
      percent('Opera Mask', fourthArtifactBonus),
      percent('True Lantern', fifthArtifactBonus),
      percent('Schematic (Dmg%)', holeUpg84),
      percent('Arcade', arcadeBonus46),
      percent('Account Option (435)', accountOpt435)
    ]),
    additiveGroup('Companions and cards', [
      percent('Companion (Frog)', companion10 ?? 0),
      percent('Companion (Valenslime)', companion156 ?? 0),
      percent('Cards', cardBonus),
      percent('Card Set', cardSetBonus)
    ]),
    additiveGroup('Arena, chip, meal, achievements and gods', [
      percent('Arena (3rd Battle Slot)', 20 * arenaBonusUnlock),
      percent('Arena (4th Battle Slot)', 40 * secondArenaBonusUnlock),
      percent('Chip', chipBonus),
      percent('Meal', mealBonus),
      percent('Achievements', achievementsBonus),
      percent('God Blessing (Flutterbis)', godBlessing),
      percent('God Blessing (Kattlecruk)', secondGodBlessing)
    ]),
    multiplier('Curses', curseReduction, { note: `Curse talent, Balanced Spirit and prayer curses, at least ×${MIN_DAMAGE_CURSE_MULTI}` }),
    multiplier('Minehead', 1 + mineheadBonus / 100),
    multiplier('Minehead (WP DMG%)', 1 + mineheadWepPow / 100),
    multiplier('Jelly Operator', 1 + jellyDmgBonus / 100),
    multiplier('Royal Statue (Total Damage)', 1 + royalStatueDmgBonus / 100),
    multiplier('Weekly Boss', weeklyBossMulti, { note: 'Max ×2.5' }),
    softcapLine(afterSoftcap, beforeSoftcap, 'Softcapped past ×100'),
    multiplier('Equipment (Dmg Multi)', 1 + postEtcBonus72 / 100),
    multiplier('Equipment (Dmg Bonus)', 1 + postEtcBonus75 / 100),
    multiplier('Equipment (EtcBonus 104)', 1 + postEtcBonus104 / 100),
    multiplier('Vote Bonus', 1 + postVoteBonus / 100),
    multiplier('Fountain', 1 + fountainSwingyBonus / 100),
    multiplier('Superbit (Destructive Gamer)', 1 + 0.1 * postSuperbit64),
    multiplier('Account Option (232)', 1 + accountOpt232 / 100),
    multiplier('Card (Passive)', 1 + postCardBonus96 / 100),
    multiplier('Sticker Multi', Math.max(1, stickerMulti)),
    additiveGroup('Tome and achievements', [
      percent('Tome', tomeBonus6),
      percent('Achievements (Final)', achievePost)
    ]),
    multiplier('Killroy', 1 + killroyBonus, { note: 'Max ×3' }),
    multiplier('Sushi', 1 + sushiDmgBonus / 100),
    multiplier('Companion (Ancient Golem)', 1 + companion12),
    multiplier('Companion (Chippy)', 1 + companion33),
    multiplier('Companion (Glunko)', 1 + 2 * companion160),
    multiplier('Companion (Crystal Glunko)', 1 + 0.5 * companion168),
    multiplier('Companion (Magician Grub)', 1 + companion170),
    multiplier('Crystal Card', 1 + crystalCardBonus / 100),
    multiplier('Meritocracy', 1 + meritBonus5 / 100),
    multiplier('Bundle', hasDmgBundle ? DMG_BUNDLE_MULTI : 1),
    multiplier('Family (DMG Multi)', 1 + famBonus80 / 100),
    softcapLine(damage, beforeReliquarium, 'The Reliquarium shrinks damage', 'Reliquarium')
  ]);

  return { value: damage, node };
}

// DamageDealtLIST[1]
const getDamageFromPerX = (character: Character, characters: Character[], account: Account, playerInfo: any,
                           hpMpDamage: number, hpMpNode: BreakdownNode) => {
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

  const items = getLootyMcShootyItems(account);
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

  // Talent 656 (DREAMER_DAMAGE) - star talent
  const dmgPerDream = getTalentBonus(character?.flatStarTalents, 'DREAMER_DAMAGE');
  // The game walks DreamChallenge only; completedClouds also counts stray d_ keys (the tome wants those)
  const completedDreams = account?.equinox?.challenges?.filter(({ current }: any) => current === -1)?.length || 0;
  const dmgPerDreamBonus = dmgPerDream * completedDreams;

  // Talent 649 (FILTHY_DAMAGE) - star talent
  const dmgPerGarbage = getTalentBonus(character?.flatStarTalents, 'FILTHY_DAMAGE');
  const dmgPerGarbageBonus = dmgPerGarbage * lavaLog(account?.accountOptions?.[161] || 0);

  // Talent 638 (DUNGEONIC_DAMAGE)
  const dmgPerDungeonCredits = getTalentBonus(character?.flatStarTalents, 'DUNGEONIC_DAMAGE')
  const dmgPerDungeonCreditsBonus = dmgPerDungeonCredits * lavaLog(account?.accountOptions?.[71]);

  // Talent 658 (QUEST_KAPOW!)
  const questTalent = getTalentBonus(character?.flatStarTalents, 'QUEST_KAPOW!');
  const totalQuestsCompleted = calcTotalQuestCompleted(characters);
  const questBonus = Math.min(totalQuestsCompleted as number, questTalent);

  const minorBonus = getCharacterMinorDivinityBonus(character, account, GOD_INDEX.Nobisect);

  const goldenKebabMulti = getGoldenFoodMultiplier('Golden_Kebabs', character, account, characters);

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
    * goldenKebabMulti;

  let value = 100 < damage ? 100 + Math.max(Math.pow(damage - 100, .86), 0) : damage;
  if (value > 2e6) {
    value = 2e6 * Math.pow(value / 2e6, .5);
  }
  if (value > 1e8) {
    value = 1e8 * Math.pow(value / 1e8, .3);
  }

  const node = productGroup('Per-X Bonuses', [
    hpMpNode,
    multiplier('Smithing Talent', dmgPerSmithingMultiplier),
    multiplier('Winner Bonus', 1 + winnerBonus / 100),
    additiveGroup('Per-X talents and bubbles', [
      percent('Minigame (Choppin)', dmgPerMinigameBonus),
      percent('Bubble (DMG of Sun)', bubbleW12),
      percent('Bubble (DMG of Moon)', bubbleA12),
      percent('Bubble (DMG of Soul)', bubbleM12),
      percent('Lowest Skill', lowestSkillBonus),
      percent('Apocalypse Zow', dmgPerApocBonus),
      percent('Refinery', dmgPerRefineryBonus),
      percent('Vials', dmgPerVialBonus),
      percent('Looty McShooty', dmgPerItemsBonus),
      percent('Stamps', dmgPerStampsBonus),
      percent('Schematic (Well Sediment)', holeUpgrade57Bonus),
      percent('Speed', dmgPerSpeedBonus),
      percent('Dreams', dmgPerDreamBonus),
      percent('Garbage', dmgPerGarbageBonus),
      percent('Dungeon Credits', dmgPerDungeonCreditsBonus),
      percent('Quests', questBonus),
      percent('Minor Divinity', minorBonus)
    ]),
    multiplier('Golden Kebabs', goldenKebabMulti),
    softcapLine(value, damage, 'Softcapped past ×100')
  ]);
  return { value, node };
}

// TalentCalc drops Gem/Cards entries from the slab list, but its index offset starts at the royal statue
// level sum left over from the previous loop, so the last <sum> entries are never checked
const getLootyMcShootyItems = (account: Account) => {
  const looted: string[] = (account as any)?.looty?.lootyRaw ?? [];
  const uncheckedTail = ((account as any)?.royalGuardian?.royalStatues ?? [])
    .reduce((sum: number, { level }: any) => sum + (Number(level) || 0), 0);
  const removed = looted.slice(0, Math.max(0, looted.length - uncheckedTail))
    .filter((name) => name?.startsWith('Gem') || name?.startsWith('Cards')).length;
  return looted.length - removed;
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
  // Game: Spelunk("ShopUpgBonus", 64, 0) - new spelunking shop upgrade this patch (Fire Hardhat).
  const spelunkShop64Bonus = getSpelunkingBonus(account, 64, 0) || 0;

  const node = additiveGroup('HP/MP Damage', [
    percent('Damage From Stat', Math.pow(damageFromStat, .7)),
    percent('Vault (Stick Snapping)', vaultUpgBonus27 * vaultKillzTotal6),
    percent('Vault (Knockout!)', vaultUpgBonus15 * accountOption338),
    percent('Vault (Weapon Craft)', 0.4 * vaultUpgBonus10),
    percent('Bribe (Muscles on Muscles)', bribeBonus30),
    percent('Bribe (Photoshopped Dmg)', bribeBonus20),
    percent('Stamps', stampBonus),
    percent('Land Rank', landRankBonus),
    percent('Statue', secondStatueBonus),
    percent('HP Talent (Meat Shank)', lavaLog(playerInfo.maxHp) * hpTalentBonus),
    percent('MP Talent (Overclocked Energy)', lavaLog(playerInfo.maxMp) * mpTalentBonus),
    percent('Owl', owlBonus),
    percent('Kangaroo', kangarooBonus),
    percent('Bubba', bubbaRoGBonus),
    percent('Vault (Raw Damage)', vaultUpgBonus80),
    percent('Spelunking (Fire Hardhat)', spelunkShop64Bonus)
  ]);

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
                  + vaultUpgBonus80
                  + spelunkShop64Bonus))))))) / 100;
  return { value, node };
}

// 2 * weapon power + main stat only counts up to this
const BASE_DAMAGE_STAT_AND_POWER_CAP = 150;

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
  const weaponPowerTerm = Math.pow(((weaponPower
    * (1 + (strWpTalent
      + agiWpTalent
      + intWpTalent
      + cosmoBonus) / 100))
    + baseWp) / 3, 2);
  const statAndPowerTerm = Math.min(BASE_DAMAGE_STAT_AND_POWER_CAP, 2 * weaponPower + damageFromStat);
  const weaponPowerEffect = weaponPowerTerm
    + (damageFromStat
      + goldenFoodBonus
      + statAndPowerTerm)
    + (arcadeBonus +
      (owlBonus
        + (vaultUpgBonus0
          + vaultUpgBonus20
          * vaultKillzTotal5)));

  const hpBubbleTerm = hpBubbleBonus * lavaLog(Math.max(playerInfo.maxHp - 250, 1));
  const speedBubbleTerm = speedBubble * (lavaLog2(Math.max((playerInfo.movementSpeed / 100) - 0.1, 0)) / .25);
  const mpBubbleTerm = mpBubble * lavaLog(Math.max(playerInfo.maxMp - 150, 1));
  const uncapped = weaponPowerEffect
    + (stampsBonus + (equipmentBonus + obolsBonus)
      + statueBonus
      + (postOfficeBonus
        + (hpBubbleTerm
          + speedBubbleTerm
          + (mpBubbleTerm
            + (cardBonus + sigilBonus)))));
  let damage = uncapped;
  if (damage > 4e3) {
    damage = 4e3 + Math.max(Math.pow(damage - 4e3, .91), 0);
  }
  if (damage > 15e3) {
    damage = 15e3 + Math.max(Math.pow(damage - 15e3, .84), 0);
  }
  const softcapped = damage;

  const foodBonus = getFoodBonus(character, account, 'BaseDmgBoosts');
  damage += foodBonus;

  const node = sumGroup('Base Damage', [
    flat('Weapon power', weaponPowerTerm, { note: 'Boosted by the weapon power talents and Cosmo' }),
    flat('Main stat', damageFromStat),
    flat('Weapon power and main stat', statAndPowerTerm, { note: `Max ${BASE_DAMAGE_STAT_AND_POWER_CAP}` }),
    flat('Golden Food', goldenFoodBonus),
    flat('Arcade', arcadeBonus),
    flat('Owl', owlBonus),
    flat('Vault (Bigger Damage)', vaultUpgBonus0),
    flat('Vault (Slice N Dice)', vaultUpgBonus20 * vaultKillzTotal5),
    flat('Stamps', stampsBonus),
    flat('Equipment', equipmentBonus),
    flat('Obols', obolsBonus),
    flat('Statue', statueBonus),
    flat('Post Office', postOfficeBonus),
    flat('HP Bubble', hpBubbleTerm),
    flat('Speed Bubble', speedBubbleTerm),
    flat('MP Bubble', mpBubbleTerm),
    flat('Cards', cardBonus),
    flat('Sigil', sigilBonus),
    flat('Softcap', softcapped - uncapped, { note: 'Base damage past 4,000 is softcapped' }),
    flat('Food', foodBonus)
  ]);

  return { baseDamage: damage, node };
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
  // Snehebatu's minor bonus is the accuracy/defence one.
  const minorBonus = getCharacterMinorDivinityBonus(character, account, GOD_INDEX.Snehebatu);

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

  // FamBonusQTYs[18], as the played character sees it
  const amplifiedFamilyBonus = getCharacterFamilyBonus(character, CLASSES.Squire);

  const { value: equipmentBonus } = getStatsFromGear(character, 15, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[15]);
  const shrineBonus = getShrineBonus(account?.shrines, 1, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const goldenFoodMulti = getGoldenFoodMultiplier('Golden_Jam', character, account, characters);

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
    * goldenFoodMulti
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
  // FamBonusQTYs[16], as the played character sees it
  const familyBonus = getCharacterFamilyBonus(character, CLASSES.Barbarian);
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
// DNSM.arbAcc3 holds the defence of the monster a damage pixel just hit and is reset to this sentinel
// right after, so AFK and per-hour math always see the target's own Defence.
export const NO_DEFENCE_OVERRIDE = 0.444;

// game: ArbitraryCode("HitChancePCT"). The Type comes from the target (arbAcc4), the defence from the
// struck monster when arbAcc3 carries one. Both curves live in utility/hit-chance.mjs.
export const calcHitChance = (accuracy: number, monster: any, defenceOverride: number = NO_DEFENCE_OVERRIDE) => {
  const defence = defenceOverride !== NO_DEFENCE_OVERRIDE ? defenceOverride : monster?.Defence;
  return hitChance(accuracy, defence, hitCurveOf(monster?.Type));
}

const getHitChance = (character: Character, characters: Character[], account: Account, playerInfo: any) =>
  calcHitChance(playerInfo?.accuracy, monsters?.[character?.targetMonster]);
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

  // game: CalcAwayKills("Killing") pushes 0 when the hit chance is 0, and HourlyKillRate reads that slot
  const hourlyKills = 0 < playerInfo.hitChance
    ? Math.min(mapNumber / (playerInfo.respawnRate + 0.1), K / (anotherMapNumber /
      (130 * (playerInfo?.movementSpeed / 100)) + actionWaitTime * Math.max((monsterHp / first + 0.52)
        * (1 / (playerInfo.hitChance / 100)), 1)))
    : 0;
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

export const getMonsterHpTotal = (baseHp: number, character: Character, account: Account) => {
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

// The defence prayer curses never cut defence below this factor
const MIN_DEFENCE_PRAYER_MULTI = 0.05;

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

  // Missing bonuses from obfuscated code
  const vaultUpgBonus46 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 46) || 0;
  const companionBonus21 = isCompanionBonusActive(account, 21) ? account?.companions?.list?.at(21)?.bonus : 0;
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'DEF_from_Equips_(Passive)');
  const amarokSetBonus = getArmorSetBonus(account, 'AMAROK_SET') || 0;
  const rooBonus1 = getKangarooBonus(account?.kangaroo?.bonuses, 'Defence') || 0;
  const vaultUpgBonus5 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 5) || 0;
  const voteBonus3 = getVoteBonus(account, 3) || 0;

  const minorBonus = getCharacterMinorDivinityBonus(character, account, GOD_INDEX.Snehebatu);

  // gearBonus now includes gallery and hatRack bonuses
  // The game floors the additive base only, then multiplies - truncating before a ~200x multiplier,
  // not after it. Flooring the whole expression instead loses the difference.
  const fmjBaseDefence = Math.min(character?.level, bubbleBonus);
  const unflooredBase = postOfficeBonus
    + cardBonus + fmjBaseDefence
    + (stampBonus
      + (equipmentBonusEtc + obolsBonusEtc)
      + arcadeBonus
      + statueBonus)
    + ((gearBonus + obolsBonus)
      * (1 + (bubbleBonus + vaultUpgBonus46 + secondCardBonus + companionBonus21 + passiveCardBonus) / 100)
      + (mealBonus + talentBonus));
  const base = Math.floor(unflooredBase);
  const prayerMulti = Math.max(MIN_DEFENCE_PRAYER_MULTI, 1 - (prayerCurse + secondPrayerCurse) / 100);

  const value = base
    * (1 + (shrineBonus + bribeBonus) / 100)
    * prayerMulti
    * (1 + (goldenFoodBonus + secondTalentBonus +
      ((secondEquipmentBonusEtc + secondObolsBonus) + (starSignBonus
        + (activeBuff + (cardSetBonus + (flurboBonus
          + chipBonus + amarokSetBonus)))))) / 100) * (1 + (minorBonus + voteBonus3) / 100)
    + rooBonus1 + vaultUpgBonus5;

  // Base defence times the multipliers, then the flat defence on top
  const breakdown = createBreakdown('Defence', notateNumber(value), [
    productGroup('Scaled base defence', [
      sumGroup('Base defence', [
        flat('Post Office', postOfficeBonus),
        flat('Card Bonus', cardBonus),
        flat('FMJ Bubble', fmjBaseDefence, { note: 'Up to the character level' }),
        flat('Stamp Bonus', stampBonus),
        flat('Equip Base Defence', equipmentBonusEtc + obolsBonusEtc),
        flat('Arcade Bonus', arcadeBonus),
        flat('Statue Bonus', statueBonus),
        productGroup('Equip Defence', [
          flat('Gear and obols', gearBonus + obolsBonus),
          additiveGroup('Equipment defence bonus', [
            percent('Bubble Bonus', bubbleBonus),
            percent('Vault', vaultUpgBonus46),
            percent('Card Bonus', secondCardBonus + passiveCardBonus),
            percent('Companion', companionBonus21 ?? 0)
          ])
        ], { unit: 'flat' }),
        flat('Meal Bonus', mealBonus),
        flat('Talents Bonus', talentBonus)
      ], { round: 'floor', note: 'Rounded down' }),
      productGroup('Multipliers', [
        additiveGroup('Shrine and bribe', [
          percent('Shrine Bonus', shrineBonus),
          percent('Bribe Bonus', bribeBonus)
        ]),
        multiplier('Prayers', prayerMulti, { note: `At least ×${MIN_DEFENCE_PRAYER_MULTI}` }),
        additiveGroup('Golden food, talents, gear and more', [
          percent('Golden Food', goldenFoodBonus),
          percent('Talents Bonus', secondTalentBonus),
          percent('Equip % Defence', secondEquipmentBonusEtc + secondObolsBonus),
          percent('Star Sign', starSignBonus),
          percent('Active Talents Bonus', activeBuff),
          percent('Cardset Bonus', cardSetBonus),
          percent('Flurbo Bonus', flurboBonus),
          percent('Chip Bonus', chipBonus),
          percent('Amarok Set Bonus', amarokSetBonus)
        ]),
        additiveGroup('Divinity and vote', [
          percent('Minor Divinity Bonus', minorBonus),
          percent('Vote Bonus', voteBonus3)
        ])
      ])
    ], { unit: 'flat' }),
    sumGroup('Flat defence', [
      flat('Roo Bonus', rooBonus1),
      flat('Vault', vaultUpgBonus5)
    ])
  ], { combine: 'sum' });

  return {
    value,
    breakdown
  }
}

// KpKDumm: the world bonus band the game picks from the map the character stands on. World 7
// (300-349) reads a Big Fish bonus on top of its gear index; below 50 and from 350 up there is no
// band at all.
const KILL_PER_KILL_WORLD_BONUS = [
  { from: 50, to: 100, etcIndex: 70 },
  { from: 100, to: 150, etcIndex: 68 },
  { from: 150, to: 200, etcIndex: 69 },
  { from: 200, to: 250, etcIndex: 73 },
  { from: 250, to: 300, etcIndex: 90 }
];

const getKillPerKill = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
  const monster = monsters?.[character?.targetMonster];
  const monsterHp = getMonsterHpTotal(monster?.MonsterHPTotal, character, account);
  const mapIndex = character?.mapIndex;
  const diminished = mapIndex >= DIMINISHED_MULTIKILL_MAP_INDEX;

  // OverkillStuffs('3'). The damage threshold uses the same exponent as the tier ladder, so it is
  // 5 from World 7 onwards rather than 2.
  const overKill = playerInfo?.maxDamage >= (diminished ? 5 : 2) * monsterHp && 0.5 < account?.towers?.towersTwo
    ? playerInfo?.accuracy > 1.5 * monster?.Defence
    : 0;

  const etcBonus = (index: number) => {
    const { value } = getStatsFromGear(character, index, account);
    return value + getObolsBonus(character?.obols, bonuses?.etcBonuses?.[index]);
  }
  const companionBonus = (index: number) => (isCompanionBonusActive(account, index)
    ? (account as any)?.companions?.list?.at(index)?.bonus ?? 0
    : 0);

  const band = KILL_PER_KILL_WORLD_BONUS.find(({ from, to }) => mapIndex >= from && mapIndex < to);
  let worldBonus = 0;
  if (diminished && mapIndex < 350) {
    worldBonus = getAdviceFishBonus(account, 3) + etcBonus(105);
  } else if (band) {
    worldBonus = etcBonus(band.etcIndex);
  }
  // FamBonusQTYs[28], the Death Bringer family bonus, as the played character sees it.
  const familyBonus = getCharacterFamilyBonus(character, CLASSES.Death_Bringer);
  const votingBonus = getVoteBonus(account, 5);

  const labBonus = getLabBonus(account?.lab?.labBonuses, 4);
  // Divinity('Bonus_MAJOR', player, 7) is Nobisect, whose major bonus doubles every kill. A pocket
  // divinity, the World 7 chosen god or the polytheism link can all supply it without a normal link.
  const majorBonus = isMajorDivinityActive(character, account, GOD_INDEX.Nobisect) ? 1 : 0;

  // KpKDumm2: the three stat talents are switched off entirely from World 7 onwards.
  const strTalentBonus = getTalentBonus(character?.flatTalents, 'CHARRED_SKULLS');
  const agiTalentBonus = getTalentBonus(character?.flatTalents, 'STACKED_SKULLS');
  const wisTalentBonus = getTalentBonus(character?.flatTalents, 'MEMORIAL_SKULLS');
  // A character with no parsed stats contributes nothing here, rather than turning the whole
  // kill-per-kill into NaN.
  const strContribution = diminished ? 0 : strTalentBonus * ((character?.stats?.strength ?? 0) / 1e3);
  const agiContribution = diminished ? 0 : agiTalentBonus * ((character?.stats?.agility ?? 0) / 1e3);
  const wisContribution = diminished ? 0 : wisTalentBonus * ((character?.stats?.wisdom ?? 0) / 1e3);

  const warTalentBonus = getTalentBonus(character?.flatTalents, 'MONSTER_DECIMATOR');
  const multiKillTotal = getMultiKillTotal(character, characters, account, playerInfo);
  const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'KILL_PER_KILL', account);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Fibers_of_Absence', account)?.bonus;
  const charmBonus = getCharmBonus(account, 'Bubblegum_Law');
  const exoticBonus = getExoticMarketBonus(account, 56);
  const legendTalentBonus = getLegendTalentBonus(account, 16);
  const bubbaBonus = (account as any)?.bubba?.bonuses?.allKills?.bonus ?? 0;
  const vaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 64);
  const friendBonusExtraKills = getFriendBonus(account, 6); // Friend Bonus type 6 (+% Extra Kills)

  const multiKillContribution = overKill ? multiKillTotal : 0;
  const additiveTotal = strContribution + agiContribution + wisContribution + warTalentBonus
    + multiKillContribution + activeBubbleBonus + prayerBonus + charmBonus + exoticBonus
    + legendTalentBonus + bubbaBonus + vaultBonus + friendBonusExtraKills;

  const labMulti = Math.max(1, labBonus);
  // Royal Statue 2 (EXTRA KILLS / multikill) - returns 0 for accounts with no Royal Guardian. The
  // game inserts this factor right after Companions(14) in both the active and AFK KillPerKill
  // branches; this site computes kill-per-kill with a single formula shared by both paths.
  const royalStatueMultikillBonus = getRoyalStatueBonus(account, 2);
  const companionFactors = [
    multiplier('Companion (14)', 1 + companionBonus(14)),
    multiplier('Royal Statue (Extra Kills)', 1 + royalStatueMultikillBonus / 100),
    multiplier('Companion (Crystal Glunko)', 1 + 0.2 * companionBonus(168)),
    multiplier('Companion (29)', 1 + companionBonus(29)),
    multiplier('Companion (154)', 1 + companionBonus(154))
  ];
  const companionMulti = companionFactors.reduce((total, { value }) => total * value, 1);
  const gearFactors = [
    multiplier('Gear (EtcBonus 96)', 1 + etcBonus(96) / 100),
    multiplier('Gear (EtcBonus 103)', 1 + etcBonus(103) / 100)
  ];
  const gearMulti = gearFactors.reduce((total, { value }) => total * value, 1);
  const worldMulti = 1 + (worldBonus + familyBonus + votingBonus) / 100;
  const majorMulti = Math.max(1, 1 + majorBonus);

  const value = labMulti * companionMulti * gearMulti * worldMulti * majorMulti * (1 + additiveTotal / 100);

  // Every top-level node multiplies
  const breakdown = createBreakdown('Kill per Kill', notateNumber(value, 'ThreeDecimals'), [
    multiplier('Lab', labMulti, { note: 'At least ×1' }),
    productGroup('Companions', companionFactors),
    productGroup('Equipment', gearFactors),
    additiveGroup('World Bonus', [
      percent('World gear and Big Fish', worldBonus),
      percent('Family (Death Bringer)', familyBonus),
      percent('Vote', votingBonus)
    ]),
    multiplier('Major Divinity (Nobisect)', majorMulti),
    additiveGroup('Additive', [
      percent('Strength Talent (Charred Skulls)', strContribution),
      percent('Agility Talent (Stacked Skulls)', agiContribution),
      percent('Wisdom Talent (Memorial Skulls)', wisContribution),
      percent('Warrior Talent (Monster Decimator)', warTalentBonus),
      percent('Multi-kill', multiKillContribution, { note: 'Only while overkilling' }),
      percent('Bubble', activeBubbleBonus),
      percent('Prayer (Fibers of Absence)', prayerBonus),
      percent('Pristine Charm (Bubblegum Law)', charmBonus),
      percent('Exotic Crop', exoticBonus),
      percent('Legend Talent', legendTalentBonus),
      percent('Bubba (Ring of Greed)', bubbaBonus),
      percent('Upgrade Vault', vaultBonus),
      percent('Friend Bonus (Extra Kills)', friendBonusExtraKills)
    ])
  ]);

  return { value, breakdown };
}

// game: "MultiKill_base" - everything that is not multiplied by the overkill tier count.
export const getMultiKillBase = (character: Character, characters: Character[], account: Account) => {
  const starSignBonus = getStarSignBonus(character, account, 'Total_Multikill');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 8);
  const stampsBonus = getStampsBonusByStat(account, 'Overkill');
  const { value: equipmentBonus } = getStatsFromGear(character, 29, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[29]);
  const achievement = getAchievementStatus(account?.achievements, 148);
  const achievementTwo = getAchievementStatus(account?.achievements, 122);
  const achievementThree = getAchievementStatus(account?.achievements, 123);
  const onyxTalentBonus = calcTotalOnyx(account) * getTalentBonus(character?.flatStarTalents, 'MONOLITHIALISM');

  return starSignBonus
    + saltLickBonus
    + (stampsBonus
      + 2 * account?.towers?.towersTwo)
    + ((equipmentBonus + obolsBonus)
      + (Math.min(5, achievement)
        + (6 * achievementTwo
          + (2 * achievementThree
            + onyxTalentBonus))));
}

// MultiKill_perTier: the part multiplied by the overkill tier count. `deathNoteIndex` is the
// world the kills happen in (the game reads floor(CurrentMap / 50)), which is not always the
// world the character is standing in.
// GetBuffBonuses(46, 2). Void Radius pays its multikill bonus out of the talent's y value, not
// x - x is the hit radius in pixels - and the game only pays it at all to a Voidwalker
// (CharacterClass 4) or Infinilyte (5) while a speedrun is actually running.
const getVoidRadiusMultiKill = (character: Character) => {
  const classIndex = (character as any)?.classIndex;
  if (classIndex !== 4 && classIndex !== 5) return 0;
  const speedrunning = (character?.activeBuffs as any)?.some(({ name }: any) => name === 'VOID_TRIAL_RERUN');
  return speedrunning ? getTalentBonusIfActive(character?.activeBuffs, 'VOID_RADIUS', 'y') : 0;
}

// game: "MultiKill_perTier"
export const getMultiKillPerTier = (character: Character, characters: Character[], account: Account, deathNoteIndex?: number) => {
  const noteIndex = deathNoteIndex ?? Math.floor(character?.mapIndex / 50);
  const deathNoteRank = account?.deathNote?.[noteIndex]?.rank || 0;
  // OverkillQTY(7) is the sneaking mini boss page of the death note. The game adds it on top of
  // the current world's page every time, so it counts no matter where the kills happen.
  const miniBossesRank = account?.deathNote?.miniBosses?.rank || 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'Overkill');
  const activeBuff = getVoidRadiusMultiKill(character);
  const voidTalentBonus = getHighestTalentAcrossCharacters(characters, 'MASTER_OF_THE_SYSTEM', character);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Multikill_per_Tier')?.bonus ?? 0;
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Trilobite_Rock')?.bonus ?? 0;
  const secondActiveBuff = getTalentBonusIfActive(character?.activeBuffs, 'MANA_IS_LIFE', 'y');
  const chipBonus = getPlayerLabChipBonus(character, account, 14);
  const { value: secondEquipmentBonus } = getStatsFromGear(character, 71, account);
  const secondObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[71]);
  const measurementBonus = getMeasurementBonus({ holesObject: account?.hole?.holesObject, accountData: account, t: 9 });
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Multikill_per_tier');
  const starSignBonus = getStarSignBonus(character, account, 'Multikill_Per_Tier');
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Pain', account)?.bonus;
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Multikill_Per_Tier');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Utilitarian_Capsule', 1);
  const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'MR_MASSACRE', account);
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet9' ? character?.cards?.cardSet?.bonus : 0;

  return deathNoteRank
    + miniBossesRank
    + (vialBonus
      + (activeBuff
        + voidTalentBonus
        * Math.floor(Number(account?.accountOptions?.[158]) / 5))
      + (arcadeBonus
        + (artifactBonus
          + secondActiveBuff)
        + (chipBonus
          + ((secondEquipmentBonus + secondObolsBonus)
            + measurementBonus
            + (cardBonus + starSignBonus)
            + (prayerBonus
              + shinyBonus)))
        + (postOfficeBonus + activeBubbleBonus + cardSetBonus)));
}

// From World 7 onwards (OverkillStuffs: 300 <= CurrentMap sets OverkillEXPONENT to 5) the game
// squashes both halves of multikill through a bracketed curve and steps the overkill tiers by 5
// instead of 2. The gate is the map the character stands on: World 6 maps (250-299) still use the
// undiminished rules.
const DIMINISHED_MULTIKILL_MAP_INDEX = 300;

// From World 7 onwards (CurrentMap >= 300) the game squashes both halves of multikill through a
// bracketed curve. The top bracket has no ceiling, it just flattens to a 1/50 slope, so a raw
// 2557 reads back as 144.29 rather than being capped near 100.
// game: "MultiKill_base" / "MultiKill_perTier" - the curve both apply on World 7+ maps.
export const getMultiKillDiminished = (value: number) => {
  if (value >= 250) return 98.14 + (value - 250) / 50;
  if (value >= 200) return 95.6 + (value - 200) / 20;
  if (value >= 150) return 90.6 + (value - 150) / 10;
  if (value >= 100) return 80.6 + (value - 100) / 5;
  if (value >= 50) return 47.3 + (value - 50) / 1.5;
  if (value >= 20) return 20 + (value - 20) / 1.1;
  return value;
}

// How many overkill tiers `maxDamage` reaches against a monster with `monsterHp`. The exponent is
// 5 from World 7 onwards and 2 before it (DNSM.OverkillEXPONENT).
export const getMultiKillTiers = (maxDamage: number, monsterHp: number, exponent = 2) => {
  let tiers = 1;
  for (let i = 0; i < 50; i++) {
    if (maxDamage >= (exponent * monsterHp * Math.pow(exponent, i + 1))) {
      tiers = i + 2;
    }
  }
  return tiers;
}

// The Clamworks is map 306, so multikill there uses the World 7+ rules: both halves go through
// the diminishing curve and the overkill exponent is 5, not 2. The clam's HP is overridden to
// Clamz_HP on map load, so it has to be passed in rather than read from the monster data.
export const getClamworksMultiKill = (character: Character, characters: Character[], account: Account, clamHp: number, maxDamage: number) => {
  const base = getMultiKillDiminished(getMultiKillBase(character, characters, account));
  // World 7 death note rank, regardless of where the character currently stands.
  const perTier = getMultiKillDiminished(getMultiKillPerTier(character, characters, account, 6));
  const tiers = getMultiKillTiers(maxDamage, clamHp, 5);
  return Math.floor(base + tiers * perTier);
}

const getMultiKillTotal = (character: Character, characters: Character[], account: Account, playerInfo: any) => {
  const monster = monsters?.[character?.targetMonster];
  const monsterHp = getMonsterHpTotal(monster?.MonsterHPTotal, character, account);
  const diminished = character?.mapIndex >= DIMINISHED_MULTIKILL_MAP_INDEX;
  const multiKills = getMultiKillTiers(playerInfo?.maxDamage, monsterHp, diminished ? 5 : 2);
  if (playerInfo) playerInfo.multiKillTiers = multiKills;

  const base = getMultiKillBase(character, characters, account);
  const perTier = getMultiKillPerTier(character, characters, account);
  return diminished
    ? Math.floor(getMultiKillDiminished(base) + multiKills * getMultiKillDiminished(perTier))
    : Math.floor(base + multiKills * perTier);
}