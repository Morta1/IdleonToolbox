import { groupByKey, notateNumber, tryToParse } from '@utility/helpers';
import { deathNote, monsters, summoningBonuses, summoningEnemies, summoningUpgrades } from '../../data/website-data';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { isArtifactAcquired } from '@parsers/sailing';
import { getAchievementStatus } from '@parsers/achievements';

const summonEssenceColor = {
  white: 0,
  green: 1,
  yellow: 2,
  blue: 3,
  purple: 4,
  red: 5,
  cyan: 6
}

export const getSummoning = (idleonData, accountData, serializedCharactersData) => {
  const rawSummon = tryToParse(idleonData?.Summon);
  return parseSummoning(rawSummon, accountData, serializedCharactersData);
}

const parseSummoning = (rawSummon, account, serializedCharactersData) => {
  const upgradesLevels = rawSummon?.[0];
  const totalUpgradesLevels = upgradesLevels?.reduce((sum, level) => sum + level, 0);
  const wonBattles = rawSummon?.[1];
  const essences = rawSummon?.[2];
  const whiteBattleIcons = ['piggo', 'Wild_Boar', 'Mallay', 'Squirrel', 'Whale', 'Bunny', 'Chippy', 'Cool_Bird',
    'Hedgehog'];
  const whiteBattleOrder = ['Pet1', 'Pet2', 'Pet3', 'Pet0', 'Pet4', 'Pet6', 'Pet5', 'Pet10', 'Pet11'];
  const allBattles = [[], [], [], [], [], [], [], []];
  const { familiarsOwned } = (rawSummon?.[4] ?? []).reduce((acc, currentValue, index) => {
    acc.familiarsOwned += acc.multiplier * currentValue;
    acc.multiplier *= index + 3;
    return acc;
  }, { familiarsOwned: 0, multiplier: 1 });
  const careerWins = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  whiteBattleOrder.forEach((enemyId, index) => {
    const monsterData = summoningEnemies.find((enemy) => enemy.enemyId === enemyId);
    if (monsterData) {
      const extraData = getBattleData(enemyId, monsterData, wonBattles);
      allBattles[0].push({ ...monsterData, ...extraData, icon: `afk_targets/${whiteBattleIcons?.[index]}` });
    }
  });
  deathNote.forEach(({ rawName, world }) => {
    const monsterData = summoningEnemies.find((enemy) => enemy.enemyId === rawName);
    if (monsterData) {
      const extraData = getBattleData(rawName, monsterData, wonBattles);
      allBattles[world + 1].push({ ...monsterData, ...extraData });
    }
  })
  const rawWinnerBonuses = wonBattles?.reduce((acc, enemyId) => {
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
    return {
      bonusId,
      bonus,
      value: rawValue
        ? 3.5 * rawWinnerBonuses?.[bonusId] * (1 + charmBonus / 100) * (1 + (artifactBonus + (Math.min(10, level * bonusPerLevel) + (firstAchievement + secondAchievement))) / 100)
        : 0,
      baseValue: rawValue
    };
  })
  let upgrades = summoningUpgrades.map((upgrade, index) => {
    return {
      ...upgrade,
      originalIndex: index,
      level: upgradesLevels?.[index],
      value: upgradesLevels?.[index] * upgrade.bonusQty,
      totalCost: upgrade?.cost * Math.pow(upgrade?.costExponent, upgradesLevels?.[index])
    }
  });
  upgrades = updateTotalBonuses(upgrades, careerWins, serializedCharactersData);
  const armyHealth = getArmyHealth(upgrades, totalUpgradesLevels);
  const armyDamage = getArmyDamage(upgrades, totalUpgradesLevels);
  upgrades = groupByKey(upgrades, ({ colour }) => colour);

  return {
    upgrades,
    winnerBonuses,
    essences,
    totalUpgradesLevels,
    familiarsOwned,
    allBattles,
    armyHealth,
    armyDamage
  }
}
const getArmyHealth = (upgrades, totalUpgradesLevels) => {
  const additiveArmyHealth = [1, 10, 35, 37].reduce((sum, bonusIndex) => {
    const hpBonus = upgrades.find(({ originalIndex }) => originalIndex === bonusIndex) || {};
    return sum + hpBonus?.value
  }, 0);
  const firstMulti = upgrades.find(({ originalIndex }) => originalIndex === 20);
  const secondMulti = upgrades.find(({ originalIndex }) => originalIndex === 50);
  const moreAdditive = upgrades.find(({ originalIndex }) => originalIndex === 59)
  const thirdMulti = upgrades.find(({ originalIndex }) => originalIndex === 61);

  return 1 * (1 + (additiveArmyHealth))
    * (1 + firstMulti?.value / 100)
    * (1 + (secondMulti?.value + moreAdditive?.value) / 100)
    * (1 + (thirdMulti?.value * Math.max(0, Math.floor(totalUpgradesLevels / 100))) / 100)

}
const getArmyDamage = (upgrades, totalUpgradesLevels) => {
  const additiveArmyDamage = [3, 12, 21, 31].reduce((sum, bonusIndex) => {
    const hpBonus = upgrades.find(({ originalIndex }) => originalIndex === bonusIndex) || {};
    return sum + hpBonus?.value
  }, 0);
  const firstMulti = upgrades.find(({ originalIndex }) => originalIndex === 43);
  const secondMulti = upgrades.find(({ originalIndex }) => originalIndex === 51);
  const moreAdditive = upgrades.find(({ originalIndex }) => originalIndex === 56)
  const thirdMulti = upgrades.find(({ originalIndex }) => originalIndex === 47);
  const fourthMulti = upgrades.find(({ originalIndex }) => originalIndex === 60);

  return 1 * (1 + (additiveArmyDamage))
    * (1 + firstMulti?.value / 100)
    * (1 + (secondMulti?.value + moreAdditive?.value) / 100)
    * (1 + (thirdMulti?.value * 0) / 100)
    * (1 + (fourthMulti?.value * Math.max(0, Math.floor(totalUpgradesLevels / 100))) / 100)
}
const getBattleData = (enemyId, monsterData, wonBattles) => {
  const icon = `data/mface${monsters?.[enemyId]?.MonsterFace}`;
  const won = wonBattles.includes(enemyId);
  const { bonus, bonusId } = summoningBonuses.find((bonus) => bonus.bonusId === monsterData.bonusId);
  const base = 3.5 * monsterData?.bonusQty;
  const actualBonus = bonus.includes('<') ? notateNumber(1 + base / 100, 'MultiplierInfo') : notateNumber(base, 'Big');
  const resultBonus = { bonusId, bonus: bonus.replace(/[<{]/, actualBonus) };
  return {
    bonus: resultBonus,
    won,
    icon
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