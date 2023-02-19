import { growth, tryToParse } from "../utility/helpers";
import { dungeonStats, dungeonFlurboStats, randomList } from "../data/website-data";

export const getDungeons = (idleonData, accountOptions) => {
  const dungeonUpgradesRaw = tryToParse(idleonData?.DungUpg) || idleonData?.DungUpg;
  return parseDungeons(dungeonUpgradesRaw, accountOptions);
};

const parseDungeons = (dungeonUpgrades, accountOptions) => {
  const dungeonUpgradesRaw = dungeonUpgrades?.[1];
  const flurbosUpgradesRaw = dungeonUpgrades?.[5];
  const insideUpgrades = dungeonUpgradesRaw?.map((level, index) => ({ ...dungeonStats[index], level }));
  const upgrades = flurbosUpgradesRaw?.map((level, index) => ({ ...dungeonFlurboStats[index], level }));
  const credits = accountOptions?.[72] || 0;
  const flurbos = accountOptions?.[73] || 0;
  const boostedRuns = accountOptions?.[76] || 0;
  const dungeonLevels = randomList?.[29].split(' ');
  const progress = accountOptions[71];
  const rank =
    Number(
      dungeonLevels.reduce((rank, req, index, _) => {
        if (accountOptions[71] > Number(req)) {
          rank = index.toString();
        }
        return rank;
      }, "0")
    ) + 1;
  const rankReq = dungeonLevels?.[rank];
  return {
    upgrades,
    insideUpgrades,
    credits,
    flurbos,
    boostedRuns,
    progress,
    rankReq,
    rank
  };
};

export const getDungeonStatBonus = (dungeonStats, statName) => {
  const stat = dungeonStats?.find(({ effect }) => effect === statName);
  if (!stat) return 0;
  return growth(stat?.func, stat?.level, stat?.x1, stat?.x2, false) ?? 0;
};
