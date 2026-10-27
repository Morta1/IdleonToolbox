import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { round } from '@utility/helpers';
import { getCardBonusByEffect } from '@parsers/cards';
import { getCharacterByHighestTalent, getTalentBonus, getTalentBonusIfActive, mainStatMap, getBestActiveCharacter, getHighestTalentAcrossCharacters } from '@parsers/talents';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { getActiveBubbleBonus, getBubbleBonus } from '@parsers/world-2/alchemy';
import { gameTables, mapNames, randomList, totems } from '@website-data';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getSkillExpMulti } from '@parsers/character';
import { createBreakdown, evaluateBreakdown, flat, multiplier, productGroup } from '@parsers/breakdown';
import type { StatBreakdown } from '@parsers/breakdown';
import { saveField } from '@parsers/saveField';

// Upgrade vault "Critters 'n Souls"
const CRITTERS_N_SOULS_VAULT_INDEX = 50;
// WorshipStuff("ExpRewards") = floor(base * (totem + 1)^2 * WorshipEXPmulti * WaveMultiplier^0.9), base from
// gameTables.worshipExpRewards
const WAVE_EXP_POWER = 0.9;
const getTotemBaseExp = (index: number) => gameTables.worshipExpRewards.base * Math.pow(index + 1, 2);


export const getTotems = (idleonData: any) => {
  const totemInfoRaw = saveField(idleonData, 'TotemInfo') || idleonData?.TotemInfo;
  const totemsNames = randomList?.[10];
  return totems?.map((totemInfo, index) => {
    // The map each totem stands on: CustomMaps WorshipMapType, read as totem to map
    const mapIndex = gameTables.worshipMapType?.[index];
    const maxWave = totemInfoRaw?.[0]?.[index] ?? 0;
    const waveMulti = (0 === maxWave ? 0 : Math.pow((5 + maxWave) / 10, 2.6))
    // Before the worshipping character's WorshipEXPmulti: getTotemExpReward applies it
    const expReward = Math.floor(getTotemBaseExp(index) * Math.pow(waveMulti, WAVE_EXP_POWER)) || 0;
    const map = mapNames?.[mapIndex];
    const totemName = totemsNames?.[index];
    return {
      ...totemInfo,
      name: totemName,
      maxWave,
      waveMulti,
      expReward,
      map
    }
  })
}

// game: WorshipStuff("ExpRewards"), the worship EXP one wave gives. skillstats2("WorshipEXPmulti") belongs to
// the character fighting the wave, the logged-in one.
export const getTotemExpReward = (totem: any, index: number, character: any, characters: any[], account: any): {
  value: number,
  breakdown: StatBreakdown
} => {
  // Logged out there is no character, and the reward is shown before any multi
  const expMulti = character ? getSkillExpMulti('worship', character, characters, account) : undefined;
  const tree = [
    flat('Totem', getTotemBaseExp(index)),
    multiplier('Wave multiplier', Math.pow(totem?.waveMulti ?? 0, WAVE_EXP_POWER)),
    expMulti
      ? productGroup('Worship EXP multi', expMulti.breakdown.tree, { min: expMulti.breakdown.min })
      : multiplier('Worship EXP multi', 1)
  ];
  const value = evaluateBreakdown(createBreakdown('Worship EXP per wave', 0, tree, { round: 'floor' }));
  return { value, breakdown: createBreakdown('Worship EXP per wave', value, tree, { round: 'floor' }) };
}

export const getTotalizerBonuses = (account: any) => {
  const totalizerUnlocked = isSuperbitUnlocked(account, 'MSA_Totalizer');
  const totalWaves = Math.floor(account?.towers?.totalWaves / 10);
  // game: GamingStatType("MSA_Bonus", 6/7/8) - the jade emporium expanders pay 1.75x, 2x and 1.5x of the waves.

  return {
    damage: { name: 'DMG', value: (totalizerUnlocked && totalizerUnlocked?.bonus) || 0 },
    sailing: { name: 'SPD', value: (totalizerUnlocked && isSuperbitUnlocked(account, 'MSA_Sailing')?.bonus) || 0 },
    classExp: {
      name: 'Class XP',
      value: (totalizerUnlocked && isSuperbitUnlocked(account, 'MSA_Class_EXP')?.bonus) || 0
    },
    cookingSpeed: {
      name: 'Meal Spd',
      value: (totalizerUnlocked && isSuperbitUnlocked(account, 'MSA_Mealing')?.bonus) || 0
    },
    bit: { name: 'Bit', value: (totalizerUnlocked && isSuperbitUnlocked(account, 'MSA_Big_Bits')?.bonus) || 0 },
    skillExp: {
      name: 'Skill XP',
      value: (totalizerUnlocked && isSuperbitUnlocked(account, 'MSA_Skill_EXP')?.bonus) || 0
    },
    farmingExp: {
      name: 'Farming XP',
      value: (totalizerUnlocked && isJadeBonusUnlocked(account, 'MSA_Expander_I')) ? 1.75 * totalWaves : 0
    },
    jadeCoin: {
      name: 'Jade Coin',
      value: (totalizerUnlocked && isJadeBonusUnlocked(account, 'MSA_Expander_II')) ? 2 * totalWaves : 0
    },
    essence: {
      name: 'Essence',
      value: (totalizerUnlocked && isJadeBonusUnlocked(account, 'MSA_Expander_III')) ? 1.5 * totalWaves : 0
    },
    spelunkingPow: {
      name: 'Spelunking Pow',
      value: (totalizerUnlocked && isSuperbitUnlocked(account, 'MSA_Spelunking')?.bonus) || 0
    },
    researchExp: {
      name: 'Research Exp',
      value: (totalizerUnlocked && isSuperbitUnlocked(account, 'MSA_Research')?.bonus) || 0
    }
  };
}

// TalentCalc(57) counts the best combined Trapping + Worship level among the beginner line
// (CharacterClass below 6) above this floor
const BEGINNER_LINE_CLASS_LIMIT = 6;
const SPECIES_EPOCH_LEVEL_FLOOR = 100;

// game: TalentCalc(57) = getbonus2(1, 57, -1) * max(0, best Trapping + Worship level - 100)
export const getSpeciesEpochBonus = (characters: any) => {
  const bestCombinedLevel = characters?.reduce((best: number, character: any) => character?.classIndex < BEGINNER_LINE_CLASS_LIMIT
    ? Math.max(best, (character?.skillsInfo?.trapping?.level || 0) + (character?.skillsInfo?.worship?.level || 0))
    : best, 0) ?? 0;
  const talentBonus = getHighestTalentAcrossCharacters(characters, 'SPECIES_EPOCH', getBestActiveCharacter(characters));
  return talentBonus * Math.max(0, bestCombinedLevel - SPECIES_EPOCH_LEVEL_FLOOR);
}

// game: the account-wide factors of WorshipStuff("SoulRewards"). The set and Ring of Greed sit in the
// food effect's sum; the talent, arcade and vault are separate multipliers.
export const getSoulsBonuses = (account: any, characters: any) => ({
  foodGroup: getArmorSetBonus(account, 'DEMENTIA_SET') + (account?.bubba?.bonuses?.soulGain?.bonus || 0),
  speciesEpoch: getSpeciesEpochBonus(characters),
  arcade: getArcadeBonus(account?.arcade?.shop, 'Worship_Souls')?.bonus || 0,
  vault: getUpgradeVaultBonus(account?.upgradeVault?.upgrades, CRITTERS_N_SOULS_VAULT_INDEX)
});

// game: WorshipStuff("SoulRewards")
export const getSoulsReward = ({ waveMulti, minEfficiency, efficiency, foodEffect, bonuses }: any) => {
  const efficiencyBonus = efficiency >= minEfficiency
    ? Math.floor(100 * Math.pow(efficiency / (10 * minEfficiency), .25))
    : 0;
  return Math.floor(5 * (1 + efficiencyBonus / 100) * waveMulti
    * (1 + (Number(foodEffect || 0) + (bonuses?.foodGroup || 0)) / 100)
    * (1 + (bonuses?.speciesEpoch || 0) / 100)
    * (1 + (bonuses?.arcade || 0) / 100)
    * (1 + (bonuses?.vault || 0) / 100));
}

export const getMaxCharge = (character: any, account: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const cardBonus = getCardBonusByEffect(account?.cards, 'Max_Charge');
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Crate_of_the_Creator', 1);
  const wizardTalentBonus = getTalentBonusIfActive(character?.activeBuffs, 'CHARGE_SYPHON', 'y');
  const stampBonus = getStampsBonusByEffect(account, 'Max_Charge', character);
  const bubbleBonus = getBubbleBonus(account, 'GOSPEL_LEADER', false, mainStat === 'wisdom');
  const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'CALL_ME_POPE', account);
  const skullSpeed = character?.tools?.[5]?.rawName !== 'Blank' ? character?.tools?.[5]?.lvReqToCraft : 0;
  return Math.floor(Math.max(50, cardBonus
    + postOfficeBonus + (wizardTalentBonus + (stampBonus
      + bubbleBonus
      * Math.floor(character?.skillsInfo?.worship?.level / 10)) + Math.round(skullSpeed) * Math.max(activeBubbleBonus, 1))))
};

// game: an empty skull slot still reads ItemDefinitionsGET["Blank"], whose Speed is 3 (and lvReqToCraft 0)
const BLANK_SKULL_SPEED = 3;

export const getChargeRate = (character: any, account: any) => {
  const skull = character?.tools?.[5];
  const skullSpeed = skull?.rawName && skull?.rawName !== 'Blank' ? skull?.Speed : BLANK_SKULL_SPEED;
  const cardBonus = getCardBonusByEffect(account?.cards, 'Charge_Rate');
  const stampBonus = getStampsBonusByEffect(account, 'Charge_Rate_per_Hour', character);
  const wizardTalentBonus = getTalentBonus(character?.flatTalents, 'NEARBY_OUTLET');
  const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'CALL_ME_POPE', account)
  if (skullSpeed < 3) {
    return 6 / Math.max(5.7 + Math.pow(4 - skullSpeed, 2.2) - (.9 * Math.pow(character?.skillsInfo?.worship?.level, .5) /
        (Math.pow(character?.skillsInfo?.worship?.level, .5) + 250) + .6 * character?.skillsInfo?.worship?.level /
        (character?.skillsInfo?.worship?.level + 40)), .57) * Math.max(activeBubbleBonus, 1)
      * (1 + (cardBonus + stampBonus) / 100) * Math.max(wizardTalentBonus, 1);
  } else {
    return (6 / Math.max(5.7 - (0.2 * Math.pow(skullSpeed, 1.3) + ((0.9 * Math.pow(character?.skillsInfo?.worship?.level, 0.5)) /
        (Math.pow(character?.skillsInfo?.worship?.level, 0.5) + 250) + (0.6 * character?.skillsInfo?.worship?.level) / (character?.skillsInfo?.worship?.level + 40))), 0.57))
      * Math.max(activeBubbleBonus, 1) * (1 + (cardBonus + stampBonus) / 100)
      * Math.max(wizardTalentBonus, 1)
  }
};

export const getPlayerWorship = (character: any, account: any, playerCharge: any) => {
  const maxCharge = getMaxCharge(character, account)
  const chargeRate = getChargeRate(character, account);
  const afkFor = new Date().getTime() - character.afkTime;
  const estimatedCharge = Math.min(parseInt(playerCharge) + chargeRate * (afkFor / 1000 / 3600), maxCharge);
  return {
    maxCharge: round(maxCharge),
    chargeRate: round(chargeRate),
    currentCharge: round(estimatedCharge)
  };
};

export const getClosestWorshiper = (characters: any) => {
  return characters?.reduce((closestWorshiper: any, character: any) => {
    const timeLeft = (character?.worship?.maxCharge - character?.worship?.currentCharge) / character?.worship?.chargeRate * 1000 * 3600;
    if (Number.isFinite(timeLeft) && timeLeft < closestWorshiper?.timeLeft) {
      return { character: character?.name, timeLeft };
    }
    return closestWorshiper;
  }, { character: null, timeLeft: Infinity })
}

export const getChargeWithSyphon = (characters: any) => {
  const totalCharge = characters?.reduce((res: any, { worship }: any) => res + (worship?.currentCharge || 0), 0);
  const totalChargeRate = characters?.reduce((res: any, { worship }: any) => res + (worship?.chargeRate || 0), 0);
  const bestChargeSyphon = getHighestTalentAcrossCharacters(characters, 'CHARGE_SYPHON', getBestActiveCharacter(characters), 'y') || 0;
  const bestWizard = getCharacterByHighestTalent(characters, null, 'CHARGE_SYPHON', 'y');

  return {
    bestWizard,
    totalCharge,
    bestChargeSyphon,
    totalChargeRate,
    timeToOverCharge: new Date().getTime() + ((((bestWizard?.worship?.maxCharge || 0) + bestChargeSyphon) - totalCharge) / totalChargeRate * 1000 * 3600)
  }
}