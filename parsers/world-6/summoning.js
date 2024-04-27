import { groupByKey, tryToParse } from '@utility/helpers';
import { deathNote, summoningBonuses, summoningEnemies, summoningUpgrades } from '../../data/website-data';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { isArtifactAcquired } from '@parsers/sailing';
import { getAchievementStatus } from '@parsers/achievements';

export const getSummoning = (idleonData, accountData, serializedCharactersData) => {
  const rawSummon = tryToParse(idleonData?.Summon);
  return parseSummoning(rawSummon, accountData, serializedCharactersData);
}

const parseSummoning = (rawSummon, account, serializedCharactersData) => {
  const upgradesLevels = rawSummon?.[0];
  const essences = rawSummon?.[2];
  const whiteBattleOrder = ['Pet1', 'Pet2', 'Pet3', 'Pet0', 'Pet4', 'Pet6', 'Pet5', 'Pet10', 'Pet11'];
  const careerWins = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
  };
  const rawWinnerBonuses = rawSummon?.[1]?.reduce((acc, enemyId) => {
    const monsterData = summoningEnemies.find((enemy) => enemy.enemyId === enemyId);
    if (monsterData) {
      const bonus = summoningBonuses.find((bonus) => bonus.bonusId === monsterData.bonusId);
      if (bonus) {
        if (acc[monsterData.bonusId]) {
          acc[monsterData.bonusId] += parseFloat(monsterData.bonusQty);
        } else {
          acc[monsterData.bonusId] = parseFloat(monsterData.bonusQty);
        }
        const whiteOrder = whiteBattleOrder.findIndex((rawName) => monsterData.enemyId === rawName);
        if (whiteOrder !== -1) {
          careerWins[0] += 1;
        } else {
          const deathNoteOrder = deathNote.find(({ rawName }) => monsterData.enemyId === rawName);
          if (deathNoteOrder) {
            careerWins[deathNoteOrder.world + 1] += 1;
          }
        }
      }
    }
    return acc;
  }, {});
  const winnerBonuses = summoningBonuses.map(({ bonusId, bonus }) => {
    const rawValue = rawWinnerBonuses?.[bonusId];
    const charmBonus = getCharmBonus(account, 'Crystal_Comb');
    const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'The_Winz_Lantern')?.bonus ?? 0;
    const firstAchievement = getAchievementStatus(account?.achievements, 373);
    const secondAchievement = getAchievementStatus(account?.achievements, 379);
    const { bonusPerLevel, level } = account?.meritsDescriptions?.[5]?.[4];
    return { bonusId, bonus, value: rawValue ? 3.5 * rawWinnerBonuses?.[bonusId] * (1 + charmBonus / 100) * (1 + (artifactBonus + (Math.min(10, level * bonusPerLevel) + (firstAchievement + secondAchievement))) / 100) : 0, baseValue: rawValue };
  })

  let upgrades = summoningUpgrades.map((upgrade, index) => ({
    ...upgrade,
    originalIndex: index,
    level: upgradesLevels?.[index],
    value: upgradesLevels?.[index] * upgrade.bonusQty,
    totalCost: upgrade?.cost * Math.pow(upgrade?.costExponent, upgradesLevels?.[index])
  }));
  upgrades = updateTotalBonuses(upgrades, careerWins, serializedCharactersData);
  upgrades = groupByKey(upgrades, ({ colour }) => colour);

  return {
    upgrades,
    winnerBonuses,
    essences
  }
}

export const getWinnerBonus = (account, bonusName) => {
  return account?.summoning?.winnerBonuses?.find(({ bonus }) => bonus === bonusName)?.value ?? 0;
}

const updateTotalBonuses = (upgrades, careerWins, serializedCharactersData) => {
  const allWins = Object.values(careerWins).reduce((sum, wins) => sum + wins, 0)
  return upgrades.map((upgrade) => {
    let totalBonus = '';
    switch (upgrade.originalIndex) {
      case 0:
        totalBonus = upgrade.value * allWins;
        break;
      case 11:
        totalBonus = upgrade.value * careerWins[0];
        break;
      case 18:
        totalBonus = upgrade.value * careerWins[1];
        break;
      case 27:
        totalBonus = upgrade.value * careerWins[2];
        break;
      case 38:
        totalBonus = upgrade.value * careerWins[3];
        break;
      case 30:
      case 40:
      case 65:
      case 66:
      case 67:
        totalBonus = upgrade.value * (serializedCharactersData?.[0]?.Lv0?.[18] ?? 1);
        break;
      default:
        break;
    }
    return {
      ...upgrade,
      totalBonus
    }
  });
}