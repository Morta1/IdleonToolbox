import { tryToParse } from '../../utility/helpers';
import { riftInfo } from '../../data/website-data';
import { constructionMasteryThresholds } from '../construction';

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

export const getConstructMastery = (totalLevels, type) => {
  if (type === 'Ref Spd') {
    return totalLevels >= constructionMasteryThresholds?.[0] ? Math.floor(totalLevels / 10) : 0;
  } else if (type === 'Dmg') {
    return totalLevels >= constructionMasteryThresholds?.[2]
      ? 2 * Math.floor((totalLevels - constructionMasteryThresholds?.[2]) / 10)
      : 0;
  } else if (type === 'Build Spd') {
    return totalLevels >= constructionMasteryThresholds?.[4]
      ? 5 * Math.floor((totalLevels - constructionMasteryThresholds?.[4]) / 10)
      : 0;
  }
  return 0;
}
