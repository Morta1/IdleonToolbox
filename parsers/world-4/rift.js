import { tryToParse } from "../../utility/helpers";
import { riftInfo } from "../../data/website-data";

export const getRift = (idleonData) => {
  const rawRift = tryToParse(idleonData?.Rift) || idleonData?.Rift;
  return parseRift(rawRift);
}

const parseRift = (rawRift) => {
  const [currentRift, currentProgress, chars] = rawRift || [];
  return {
    list: riftInfo,
    currentRift: parseInt(currentRift),
    currentProgress,
    chars
  }
}

export const isRiftBonusUnlocked = (rift, bonusName) => {
  return rift?.list?.find(({ riftBonus }, index) => {
    return riftBonus === bonusName && index <= rift?.currentRift
  });
}

