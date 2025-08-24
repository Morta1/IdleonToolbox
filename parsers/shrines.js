import { tryToParse } from '../utility/helpers';
import { shrines } from '../data/website-data';
import { calcCardBonus, getCardBonusByEffect } from './cards';
import { isArtifactAcquired } from './sailing';
import { isSuperbitUnlocked } from './gaming';
import { getGoldenFoodBonus, isMasteryBonusUnlocked } from './misc';
import { getPostOfficeBonus } from './postoffice';
import { getTalentBonus } from './talents';
import { getVialsBonusByEffect } from './alchemy';
import { getVoteBonus } from '@parsers/world-2/voteBallot';

const startingIndex = 18;

export const getShrines = (idleonData, account) => {
  const shrinesRaw = idleonData?.ShrineInfo || tryToParse(idleonData?.Shrine);
  const towersRaw = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  return parseShrines(shrinesRaw, towersRaw, account);
}

export const parseShrines = (shrinesRaw, towersRaw, account) => {
  const worldTour = account?.lab?.labBonuses?.find((bonus) => bonus.name === 'Shrine_World_Tour')?.active;
  const shrineStuff = shrinesRaw?.map((item, localIndex) => {
    const index = startingIndex + localIndex;
    const [, , , shrineLevel] = item;
    const { baseBonus, bonusPerLevel } = shrines[index];
    const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Shrine_Effects_(Passive)');
    return (1 + (passiveCardBonus) / 100) * ((shrineLevel - 1) * bonusPerLevel + baseBonus)
  })
  return shrinesRaw?.reduce((res, item, localIndex) => {
    const index = startingIndex + localIndex;
    const [mapId, , , shrineLevel, progress] = item;
    const { shrineName, desc, baseBonus, bonusPerLevel } = shrines[index];
    const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Shrine_Effects_(Passive)');
    const crystalShrineBonus = shrinesRaw?.[2]?.[0] === mapId ? shrineStuff?.[2] : 0;
    return shrineName !== 'Unknown' ? [...res, {
      mapId,
      shrineLevel,
      name: shrineName,
      rawName: `ConTowerB${index}`,
      bonus: (1 + (passiveCardBonus) / 100) * ((shrineLevel - 1) * bonusPerLevel + baseBonus),
      progress,
      desc,
      worldTour,
      crystalShrineBonus,
      shrineTowerValue: towersRaw?.[startingIndex + localIndex]
    }] : res;
  }, []);
}

export const getShrineExpBonus = (characters, account) => {
  const total = new Array(9).fill(0);
  let breakdown = {};
  characters?.forEach((character) => {
    const characterMap = character?.mapIndex;
    const superbit = isSuperbitUnlocked(account, 'Shrine_Speed') ? 1 : 0;
    const artifact = isArtifactAcquired(account?.sailing?.artifacts, 'Moai_Head');
    let artifactBonus = 0;
    if (artifact) {
      artifactBonus += artifact?.acquired === 3
        ? artifact?.eldritchMultiplier
        : artifact?.acquired === 2 ? artifact?.ancientMultiplier * 2 : artifact?.baseBonus;
    }
    const skillMastery = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.construction?.rank, 1) || 0;
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Construction_Container', 1);
    const goldenFoodBonus = getGoldenFoodBonus('Golden_Cheese', character, account, characters);
    const talentBonus = getTalentBonus(character?.flatStarTalents, 'SHRINE_ARCHITECT');
    const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'ShrineSpd');
    const voteBonus = getVoteBonus(account, 19);
    account?.shrines?.forEach((shrine, shrineIndex) => {
      const { shrineTowerValue, crystalShrineBonus } = shrine;
      const result = { name: character?.name, value: 0 }
      if (!isGlobalApplicable(shrine, character?.mapIndex)) return result;
      const expBonus = (1 + (50 * superbit) / 100)
        * (1 + (artifactBonus
          + 15 * skillMastery) / 100)
        * (1 + voteBonus / 100)
        * (1 + (10 * shrineTowerValue) / 100)
        * (1 + (crystalShrineBonus
          + (postOfficeBonus
            + (goldenFoodBonus
              + (talentBonus
                + vialBonus)))) / 100);
      total[shrineIndex] += expBonus;
      breakdown = {
        ...breakdown,
        [shrineIndex]: [
          ...breakdown?.[shrineIndex] || [],
          { name: character?.name, value: expBonus }
        ]
      }
    })
  })
  return {
    total,
    breakdown
  }
}

const isGlobalApplicable = (shrine, playerMapId) => {
  const playerWorld = Math.floor(playerMapId / 50);
  const shrineWorld = Math.floor(shrine?.mapId / 50);
  const shrineInTown = shrine?.mapId % 50 === 0;
  return (shrine?.worldTour && shrineInTown && playerWorld === shrineWorld) || playerMapId === shrine?.mapId;
}

export const getShrineBonus = (shrines, shrineIndex, playerMapId, cards, artifacts) => {
  const shrine = shrines?.[shrineIndex];
  if (!shrine) {
    return 0;
  }
  const moaiHead = artifacts === true || Array.isArray(artifacts) && isArtifactAcquired(artifacts, 'Moai_Head');
  const playerWorld = Math.floor(playerMapId / 50);
  const shrineWorld = Math.floor(shrine?.mapId / 50);
  const shrineInTown = shrine?.mapId % 50 === 0;
  const notSameMap = playerMapId !== shrine?.mapId;
  const globalApplicable = (shrine?.worldTour && shrineInTown && playerWorld === shrineWorld) || !!moaiHead;
  if (shrine?.shrineLevel === 0 || (notSameMap && !globalApplicable)) {
    return 0;
  }
  return shrine?.bonus;
}

export const calcShrineLevels = (allShrines) => {
  if (!allShrines) return 0;
  return Object.values(allShrines)?.reduce((res, { shrineLevel }) => res + shrineLevel, 0);
};