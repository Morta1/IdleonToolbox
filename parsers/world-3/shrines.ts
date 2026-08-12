import { tryToParse } from '@utility/helpers';
import { shrines } from '@website-data';
import { liveEntries } from '@parsers/catalog';
import { calcCardBonus, getCardBonusByEffect } from '@parsers/cards';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { getGoldenFoodBonus, isMasteryBonusUnlocked } from '@parsers/misc';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { getTalentBonus } from '@parsers/talents';
import { getVialsBonusByEffect } from '@parsers/world-2/alchemy';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';

const startingIndex = 18;

export const isLiveShrineEntry = (entry: any): boolean => entry?.shrineName !== 'Unknown';

export const getShrines = (idleonData: any, account: any) => {
  const shrinesRaw = idleonData?.ShrineInfo || tryToParse(idleonData?.Shrine);
  const towersRaw = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  return parseShrines(shrinesRaw, towersRaw, account);
}

// (shrineLevel - 1) yields a bonus at level 0, so an unbuilt shrine advertised one it does not
// give. getShrineBonus already discards it, but crystalShrineBonus did not - an unbuilt Crystal
// Shrine fed a phantom bonus straight into shrine EXP.
const shrineBonus = (shrineLevel: number, entry: any, passiveCardBonus: number) => shrineLevel > 0
  ? (1 + passiveCardBonus / 100) * ((shrineLevel - 1) * entry.bonusPerLevel + entry.baseBonus)
  : 0;

export const parseShrines = (shrinesRaw: any, towersRaw: any, account: any) => {
  const worldTour = account?.lab?.labBonuses?.find((bonus: any) => bonus.name === 'Shrine_World_Tour')?.active;
  const shrineCatalog = Object.entries(shrines)
    .map(([key, value]: [string, any]) => ({ globalIndex: Number(key), ...value }));
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Shrine_Effects_(Passive)');
  const liveShrines = liveEntries<any>(shrineCatalog).filter(({ entry }) => isLiveShrineEntry(entry));
  const shrineStuff = liveShrines.map(({ entry, index: localIndex }) => {
    const item = shrinesRaw?.[localIndex];
    const [, , , shrineLevel = 0] = item ?? [];
    return shrineBonus(shrineLevel, entry, passiveCardBonus);
  })
  return liveShrines.map(({ entry, index: localIndex }) => {
    const index = startingIndex + localIndex;
    const item = shrinesRaw?.[localIndex];
    const [mapId = 0, , , shrineLevel = 0, progress = 0] = item ?? [];
    const { shrineName, desc } = entry;
    const crystalShrineBonus = shrinesRaw?.[2]?.[0] === mapId ? shrineStuff?.[2] : 0;
    return {
      mapId,
      shrineLevel,
      name: shrineName,
      rawName: `ConTowerB${index}`,
      bonus: shrineBonus(shrineLevel, entry, passiveCardBonus),
      progress,
      desc,
      worldTour,
      crystalShrineBonus,
      shrineTowerValue: towersRaw?.[index]
    };
  });
}

export const getShrineExpBonus = (characters: any, account: any) => {
  const total = new Array(9).fill(0);
  let breakdown: any = {};
  characters?.forEach((character: any) => {
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
    const legendTalentBonus = getLegendTalentBonus(account, 38);
    account?.shrines?.forEach((shrine: any, shrineIndex: any) => {
      const { shrineTowerValue, crystalShrineBonus } = shrine;
      const result = { name: character?.name, value: 0 }
      if (!isGlobalApplicable(shrine, character?.mapIndex, legendTalentBonus)) return result;
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

const isGlobalApplicable = (shrine: any, playerMapId: any, legendTalentBonus: any) => {
  const playerWorld = Math.floor(playerMapId / 50);
  const shrineWorld = Math.floor(shrine?.mapId / 50);
  const shrineInTown = shrine?.mapId % 50 === 0;
  return (shrine?.worldTour && shrineInTown && playerWorld === shrineWorld) || (playerMapId === shrine?.mapId) || !!legendTalentBonus;
}

export const getShrineBonus = (shrines: any, shrineIndex: any, playerMapId: any, cards: any, artifacts: any) => {
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

export const calcShrineLevels = (allShrines: any) => {
  if (!allShrines) return 0;
  return (Object.values(allShrines) as any[])?.reduce((res: number, { shrineLevel }: any) => res + shrineLevel, 0);
};