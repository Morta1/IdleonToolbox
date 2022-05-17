import { arenaBonuses, petUpgrades } from "../data/website-data";
import { tryToParse } from "../utility/helpers";

export const getBreeding = (idleonData, account) => {
  const breedingRaw = tryToParse(idleonData?.Breeding) || idleonData?.Breeding;
  return parseBreeding(breedingRaw, account);
}

const parseBreeding = (breedingRaw, account) => {
  const eggs = breedingRaw[0];
  const deadCells = breedingRaw[3][8];
  const speciesUnlocks = breedingRaw[1];
  const petUpgradesList = breedingRaw?.[2]?.map((upgradeLevel, index) => {
    return {
      ...(petUpgrades[index] || []),
      level: upgradeLevel
    }
  })

  return {
    eggs,
    deadCells,
    speciesUnlocks,
    maxArenaLevel: account?.accountOptions?.[89],
    petUpgrades: petUpgradesList,
    arenaBonuses
  };
}