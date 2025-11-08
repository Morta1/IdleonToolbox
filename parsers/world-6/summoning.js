import { createRange, groupByKey, notateNumber, tryToParse } from '@utility/helpers';
import {
  deathNote,
  monsters,
  summoningBonuses,
  summoningEndless,
  summoningEnemies,
  summoningUpgrades
} from '../../data/website-data';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { isArtifactAcquired } from '@parsers/sailing';
import { getAchievementStatus } from '@parsers/achievements';
import { getArmorSetBonus } from '@parsers/misc/armorSmithy';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getTesseractBonus } from '@parsers/tesseract';

const summonEssenceColor = {
  0: 'white',
  1: 'green',
  2: 'yellow',
  3: 'blue',
  4: 'purple',
  5: 'red',
  6: 'cyan'
}
const stoneNames = {
  0: 'aether',
  1: 'grover',
  2: 'shimmer',
  3: 'freezer',
  4: 'hexer',
  5: 'cinder',
  6: 'zephyer'
}

export const getSummoning = (idleonData, accountData, serializedCharactersData) => {
  const rawSummon = tryToParse(idleonData?.Summon);
  const killRoyKills = tryToParse(idleonData?.KRbest);
  return parseSummoning(rawSummon, killRoyKills, accountData, serializedCharactersData);
}

const parseSummoning = (rawSummon, killRoyKills, account, serializedCharactersData) => {
  const highestEndlessLevel = account?.accountOptions?.[319] ?? 0;
  const upgradesLevels = rawSummon?.[0];
  const totalUpgradesLevels = upgradesLevels?.reduce((sum, level) => sum + level, 0);
  const summoningStuff = rawSummon?.[3];
  const wonBattles = rawSummon?.[1];
  const essences = rawSummon?.[2];
  const whiteBattleIcons = ['Piggo', 'Wild_Boar', 'Mallay', 'Squirrel', 'Whale', 'Bunny', 'Chippy', 'Cool_Bird',
    'Hedgehog'];
  const whiteBattleOrder = ['Pet1', 'Pet2', 'Pet3', 'Pet0', 'Pet4', 'Pet6', 'Pet5', 'Pet10', 'Pet11'];
  const allBattles = [[], [], [], [], [], [], [], [], [], []];
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
  // 9 === this._GenINFO[146]
  deathNote.forEach(({ rawName, world }) => {
    const monsterData = summoningEnemies.find((enemy) => enemy.enemyId === rawName);
    if (monsterData) {
      const extraData = getBattleData(rawName, monsterData, wonBattles);
      allBattles[world + 1].push({ ...monsterData, ...extraData });
    }
  })
  let rawWinnerBonuses = wonBattles?.reduce((acc, enemyId) => {
    const monsterData = summoningEnemies.find((enemy) => enemy.enemyId === enemyId);
    if (monsterData && monsterData?.bonusId < 20) {
      const bonus = summoningBonuses.find((bonus) => bonus.bonusId === monsterData.bonusId);
      if (bonus) {
        if (acc[monsterData.bonusId]) {
          acc[monsterData.bonusId] += parseFloat(monsterData.bonusQty);
        }
        else {
          acc[monsterData.bonusId] = parseFloat(monsterData.bonusQty);
        }
        const whiteOrder = whiteBattleOrder.findIndex((rawName) => monsterData.enemyId === rawName);
        if (whiteOrder !== -1) {
          careerWins[0] += 1;
        }
        else {
          const deathNoteOrder = deathNote.find(({ rawName }) => monsterData.enemyId === rawName);
          if (deathNoteOrder) {
            careerWins[deathNoteOrder.world + 1] += 1;
          }
        }
      }
    }
    return acc;
  }, {});
  for (let index = 0; index < highestEndlessLevel; index++) {
    const wrappedIndex = index % 40;
    const bonusIndex = Math.round(Number(summoningEndless.bonusIds[wrappedIndex]) - 1);
    rawWinnerBonuses[bonusIndex] = (Number(rawWinnerBonuses[bonusIndex]) || 0) + Number(summoningEndless.bonusQuantities[wrappedIndex]);
  }
  const winnerBonuses = summoningBonuses.map(({ bonusId, bonus }, index) => {
    const rawValue = rawWinnerBonuses?.[index];
    const calcVal = getLocalWinnerBonus(rawWinnerBonuses, account, index);

    return {
      bonusId,
      bonus,
      value: calcVal,
      baseValue: rawValue
    };
  });
  const gambitStuff = account?.hole?.holesObject?.gambitStuff;
  let upgrades = summoningUpgrades.map((upgrade, index) => {
    const doubled = gambitStuff && gambitStuff?.includes(index);
    return {
      ...upgrade,
      originalIndex: index,
      level: upgradesLevels?.[index],
      value: upgradesLevels?.[index] * upgrade.bonusQty * (doubled ? 2 : 1),
      doubled
    }
  });
  upgrades = upgrades.map((upgrade, index) => {
    const costDeflation = upgrades.find(({ originalIndex }) => originalIndex === 49);
    const costCrashing = upgrades.find(({ originalIndex }) => originalIndex === 57);
    const tesseractBonus = getTesseractBonus(account, 54) * account?.accountOptions?.[319];
    const cost = (1 / (1 + costDeflation?.value / 100))
      * (1 / (1 + costCrashing?.value / 100))
      * (1 / (1 + tesseractBonus / 100))
      * upgrade?.cost
      * Math.pow(upgrade?.costExponent, upgradesLevels?.[index]);
    return { ...upgrade, totalCost: cost }
  });
  upgrades = updateTotalBonuses(upgrades, careerWins, serializedCharactersData, highestEndlessLevel);
  const armyHealth = getArmyHealth(upgrades, totalUpgradesLevels, account);
  const armyDamage = getArmyDamage(upgrades, totalUpgradesLevels, account);
  upgrades = groupByKey(upgrades, ({ colour }) => colour);
  const summoningStones = Object.entries(killRoyKills)
    .filter(([name]) => name.includes('SummzTrz'))
    .map(([name, kills]) => {
      const index = parseInt(name.match(/\d+$/)[0], 10);
      const enemy = summoningEnemies[106 + index];
      const isBoss6 = enemy?.enemyId === 'Boss6';
      const rawName = isBoss6 ? 'Boss6A' : enemy?.enemyId
      const monsterName = monsters?.[rawName]?.Name;
      const bossHp = 2 * enemy?.hp * Math.pow(4000, kills);
      const nextLevelHps = createRange(kills + 1, kills + 14).map((futureKills) => {
        return 2 * enemy?.hp * Math.pow(4000, futureKills)
      })
      return {
        name: enemy?.territoryName,
        monsterIcon: isBoss6 ? `data/${enemy?.enemyId}` : `afk_targets/${monsterName}`,
        stoneName: stoneNames[index],
        kills,
        index,
        bonus: `${summonEssenceColor[index]}_` + Math.max(2, 1 + kills) + 'x_higher_bonuses',
        bossHp,
        nextLevelHps
      }
    })
    .toSorted((a, b) => a.index - b.index);
  const totalSummoningStonesKills = summoningStones.reduce((sum, { kills }) => sum + kills, 0);
  return {
    upgrades,
    winnerBonuses,
    essences,
    totalUpgradesLevels,
    familiarsOwned,
    allBattles,
    armyHealth,
    armyDamage,
    summoningStuff,
    highestEndlessLevel,
    totalWins: allBattles?.flat()?.reduce((sum, { won }) => sum + (won ? 1 : 0), 0) + highestEndlessLevel,
    summoningStones,
    totalSummoningStonesKills
  }
}

export const getEndlessBattles = (battles = 100, highestEndlessLevel, winnerBonuses) => {
  const endlessBattles = [];
  for (let i = 0; i < highestEndlessLevel + battles; i++) {
    const index = i % 40;
    const difficultyIndex = getEndlessModifier(i, 0, 0);
    const bonusId = summoningEndless.bonusIds?.[index];
    const bonus = structuredClone(summoningBonuses?.[bonusId - 1]);
    const bonusQty = summoningEndless.bonusQuantities[index] * (1 + (winnerBonuses?.[31]?.value ?? 0) / 100);
    const actualBonus = bonus?.bonus?.includes('<')
      ? (1 + bonusQty / 100)
      : (bonusQty);
    bonus.bonus = bonus?.bonus?.replace(/[<{]/, actualBonus.toFixed(2).replace('.00', ''));
    const riftIndex = summoningEnemies.findIndex((enemy) => enemy.enemyId.includes('rift1'));
    const monsterId = Math.round(riftIndex + Math.min(4, Math.floor(i / 20)));
    const [name, ...rest] = summoningEndless.difficultiesText?.[difficultyIndex].split('|');
    const monster = summoningEnemies?.[monsterId];
    endlessBattles.push({
      ...monster,
      bonus,
      bonusQty,
      difficulty: { name, sentence: rest.join('_') },
      won: highestEndlessLevel > i,
      icon: `etc/${monster?.enemyId}_monster`
    });
  }
  return endlessBattles;
}
const getEndlessModifier = (endlessLevel, t, i) => {
  return 99 === i
    ? (t === getEndlessModifier(endlessLevel, 0, 0) ? 1 : 0)
    : summoningEndless.difficulties[Math.round(endlessLevel - 40 * Math.floor(endlessLevel / 40))]
}

const getLocalWinnerBonus = (rawWinnerBonuses, account, index) => {
  const rawValue = rawWinnerBonuses?.[index] || 0;
  const charmBonus = getCharmBonus(account, 'Crystal_Comb');
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'The_Winz_Lantern')?.bonus ?? 0;
  const firstAchievement = getAchievementStatus(account?.achievements, 373);
  const secondAchievement = getAchievementStatus(account?.achievements, 379);
  const emperorBonus = getEmperorBonus(account, 8);
  const armorSetBonus = getArmorSetBonus(account, 'GODSHARD_SET')
  const { bonusPerLevel, level } = account?.meritsDescriptions[5][4];
  let val;

  if (index === 20 || index === 22 || index === 24 || index === 31) {
    val = rawValue;
  }
  else if (index === 19) {
    val = 3.5 * rawValue *
      (1 + charmBonus / 100) *
      (1 + (artifactBonus +
        Math.min(10, level * bonusPerLevel) +
        firstAchievement +
        secondAchievement +
        armorSetBonus) / 100);
  }
  else if (index >= 20 && index <= 33) {
    const multiCalc = getLocalWinnerBonus(rawWinnerBonuses, account, 31);
    const multi = multiCalc === 0 ? 0 : multiCalc;
    val = rawValue *
      (1 + charmBonus / 100) *
      (1 + (artifactBonus +
        Math.min(10, level * bonusPerLevel) +
        firstAchievement +
        secondAchievement +
        armorSetBonus +
        emperorBonus +
        multi) / 100);
  }
  else {
    const multiCalc = getLocalWinnerBonus(rawWinnerBonuses, account, 31);
    const multi = multiCalc === 0 ? 0 : multiCalc;
    val = 3.5 * rawValue *
      (1 + charmBonus / 100) *
      (1 + (artifactBonus +
        Math.min(10, level * bonusPerLevel) +
        firstAchievement +
        secondAchievement +
        armorSetBonus +
        emperorBonus +
        multi) / 100);
  }
  return val;
}
const getLocalSummoningBonus = (upgrades, index) => {
  return upgrades.find(({ originalIndex }) => originalIndex === index)?.value || 0
}
const getStoneBossHp = ({ type }) => {

  return 2 * summoningEnemies[type] * Math.pow(4000, kills);
}
const getArmyHealth = (upgrades, totalUpgradesLevels, account) => {
  const additiveArmyHealth = [1, 10, 35, 37].reduce((sum, bonusIndex) => {
    const hpBonus = upgrades.find(({ originalIndex }) => originalIndex === bonusIndex) || {};
    return sum + hpBonus?.value
  }, 0);
  const firstMulti = upgrades.find(({ originalIndex }) => originalIndex === 20)?.value || 0;
  const secondMulti = upgrades.find(({ originalIndex }) => originalIndex === 50)?.value || 0;
  const moreAdditive = upgrades.find(({ originalIndex }) => originalIndex === 59)?.value || 0;
  const thirdMulti = upgrades.find(({ originalIndex }) => originalIndex === 61)?.value || 0;
  const endlessMulti = upgrades.find(({ originalIndex }) => originalIndex === 63)?.value || 0;

  return 1 * (1 + additiveArmyHealth)
    * (1 + firstMulti / 100)
    * (1 + (secondMulti
      + (moreAdditive
        + endlessMulti
        * account?.accountOptions?.[319])) / 100)
    * (1 + (thirdMulti
      * Math.max(0, Math.floor(totalUpgradesLevels / 100))) / 100);

}
const getArmyDamage = (upgrades, totalUpgradesLevels, account) => {
  const additiveArmyDamage = [3, 12, 21, 31].reduce((sum, bonusIndex) => {
    const hpBonus = upgrades.find(({ originalIndex }) => originalIndex === bonusIndex) || {};
    return sum + hpBonus?.value
  }, 0);
  const firstMulti = upgrades.find(({ originalIndex }) => originalIndex === 43)?.value || 0;
  const secondMulti = upgrades.find(({ originalIndex }) => originalIndex === 51)?.value || 0;
  const moreAdditive = upgrades.find(({ originalIndex }) => originalIndex === 56)?.value || 0;
  const thirdMulti = upgrades.find(({ originalIndex }) => originalIndex === 47)?.value || 0;
  const fourthMulti = upgrades.find(({ originalIndex }) => originalIndex === 60)?.value || 0;
  const endlessMulti = upgrades.find(({ originalIndex }) => originalIndex === 64)?.value || 0;

  return 1 * (1 + (additiveArmyDamage))
    * (1 + firstMulti / 100)
    * (1 + (secondMulti
      + (moreAdditive
        + endlessMulti
        * account?.accountOptions?.[319])) / 100)
    * (1 + (thirdMulti * 0) / 100)
    * (1 + (fourthMulti
      * Math.max(0, Math.floor(totalUpgradesLevels / 100))) / 100);
}
const getBattleData = (enemyId, monsterData, wonBattles) => {
  const icon = `data/Mface${monsters?.[enemyId]?.MonsterFace}`;
  const won = wonBattles?.includes(enemyId);
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

const updateTotalBonuses = (upgrades, careerWins, serializedCharactersData, highestEndlessLevel) => {
  const allWins = Object.values(careerWins).reduce((sum, wins) => sum + wins, 0);
  const totalUpgrades = upgrades.reduce((sum, { level }) => sum + level, 0);
  return upgrades.map((upgrade) => {
    let totalBonus = '';
    switch (upgrade.originalIndex) {
      case 0:
        totalBonus = upgrade.value * allWins;
        break;
      case 11:
        totalBonus = upgrade.value * careerWins[1];
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
      case 54:
        totalBonus = upgrade.value * careerWins[6];
        break;
      case 49:
      case 57:
        totalBonus = upgrade.value;
        break;
      case 30:
      case 40:
      case 65:
      case 66:
      case 67:
      case 46:
      case 52:
      case 58:
        totalBonus = upgrade.value * (serializedCharactersData?.[0]?.Lv0?.[18] ?? 1);
        break;
      case 60:
      case 61:
        totalBonus = upgrade.value * (totalUpgrades / 100);
        break;
      case 62:
      case 63:
      case 64:
        totalBonus = upgrade.value * highestEndlessLevel;
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