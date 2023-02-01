import { tryToParse } from "../utility/helpers";
import { shrines } from '../data/website-data';
import { calcCardBonus } from "./cards";
import { isArtifactAcquired } from "./sailing";

const startingIndex = 18;

export const getShrines = (idleonData, account) => {
  const shrinesRaw = idleonData?.ShrineInfo || tryToParse(idleonData?.Shrine);
  return parseShrines(shrinesRaw, account);
}

export const parseShrines = (shrinesRaw, account) => {
  const worldTour = account?.lab?.labBonuses?.find((bonus) => bonus.name === 'Shrine_World_Tour')?.active
  return shrinesRaw?.reduce((res, item, localIndex) => {
    const index = startingIndex + localIndex;
    const [mapId, , , shrineLevel, progress] = item;
    const { shrineName, desc, baseBonus, bonusPerLevel } = shrines[index];
    return mapId !== 0 && shrineName !== 'Unknown' ? [...res, {
      mapId,
      shrineLevel,
      name: shrineName,
      rawName: `ConTowerB${index}`,
      bonus: baseBonus + (shrineLevel - 1) * bonusPerLevel,
      progress,
      desc,
      worldTour
    }] : res;
  }, []);
}

export const getShrineBonus = (shrines, shrineIndex, playerMapId, cards, artifacts) => {
  const moaiHead = artifacts === true ?? isArtifactAcquired(artifacts, 'Moai_Head');
  const shrine = shrines?.[shrineIndex];
  const playerWorld = Math.floor(playerMapId / 50);
  const shrineWorld = Math.floor(shrine?.mapId / 50);
  const shrineInTown = shrine?.mapId % 50 === 0;
  const notSameMap = playerMapId !== shrine?.mapId;
  const globalApplicable = (shrine?.worldTour && shrineInTown && playerWorld === shrineWorld) || moaiHead;
  if (shrine?.level === 0 || (notSameMap && !globalApplicable)) {
    return 0;
  }
  const chaoticChizoarCard = cards?.Chaotic_Chizoar;
  const cardBonus = calcCardBonus(chaoticChizoarCard) ?? 0;
  return shrine?.bonus * (1 + cardBonus / 100);
}