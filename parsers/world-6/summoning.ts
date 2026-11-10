import { cleanUnderscore, createRange, gameFill, groupByKey, tryToParse } from '@utility/helpers';
import { monsterSprite } from '@utility/spriteImages';
import {
  deathNote,
  gameTables,
  monsters,
  summoningBonuses,
  summoningEndless,
  summoningEnemies,
  summoningUpgrades,
  mapEnemiesArray,
  mapNames
} from '@website-data';
import { getLoggedInSkillLevel, isBundlePurchased, isMasteryBonusUnlocked } from '@parsers/misc';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { getSlabBonus, isArtifactAcquired } from '@parsers/world-5/sailing';
import { getAchievementStatus } from '@parsers/achievements';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getBestActiveCharacter, getHighestTalentAcrossCharacters } from '@parsers/talents';
import { getBubbleBonus, getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { getStampLineName, getStampNode, getStampsBonusByStat } from '@parsers/world-1/stamps';
import { getStatueBonus } from '@parsers/world-1/statues';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getFountainBonusTotal } from '@parsers/world-5/caverns/the-fountain';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getTomeBubbleMulti } from '@parsers/world-4/tome';
import { getTotalizerBonuses } from '@parsers/world-3/worship';
import { getMenagerieBoost, getSumCostReduxMena } from '@parsers/world-7/menagerie';
import { additiveGroup, createBreakdown, evaluateBreakdown, flat, multiplier, NUMBERED_GROUP, percent, productGroup, sumGroup } from '@parsers/breakdown';
import type { BreakdownNode, StatBreakdown } from '@parsers/breakdown';
import { OPT } from '@parsers/accountOptions';
import { saveField } from '@parsers/saveField';

export const summonEssenceColor = {
  0: 'white',
  1: 'green',
  2: 'yellow',
  3: 'blue',
  4: 'purple',
  5: 'red',
  6: 'cyan',
  7: 'teal'
}
// The colour names the summoning pages print, by colour index
export const SUMMONING_COLOURS: Record<string, string> = Object.fromEntries(Object.entries(summonEssenceColor)
  .map(([index, colour]) => [index, colour.charAt(0).toUpperCase() + colour.slice(1)]));
const stoneNames = {
  0: 'aether',
  1: 'grover',
  2: 'shimmer',
  3: 'freezer',
  4: 'hexer',
  5: 'cinder',
  6: 'zephyer'
}

export const getSummoning = (idleonData: any, accountData: any, serializedCharactersData: any, characters: any[] = []) => {
  const rawSummon = tryToParse(idleonData?.Summon);
  const killRoyKills = saveField(idleonData, 'KRbest');
  return parseSummoning(rawSummon, killRoyKills, accountData, serializedCharactersData, characters);
}

const parseSummoning = (rawSummon: any, killRoyKills: any, account: any, serializedCharactersData: any, characters: any[] = []) => {
  const highestEndlessLevel = account?.accountOptions?.[OPT.summoningHighestEndless] ?? 0;
  const upgradesLevels = rawSummon?.[0];
  const totalUpgradesLevels = upgradesLevels?.reduce((sum: any, level: any) => sum + level, 0) ?? 0;
  const summoningStuff = rawSummon?.[3];
  const wonBattles = rawSummon?.[1];
  const essences = rawSummon?.[2];
  const whiteBattleIcons = ['Piggo', 'Wild_Boar', 'Mallay', 'Squirrel', 'Whale', 'Bunny', 'Chippy', 'Cool_Bird',
    'Hedgehog'];
  const whiteBattleOrder = ['Pet1', 'Pet2', 'Pet3', 'Pet0', 'Pet4', 'Pet6', 'Pet5', 'Pet10', 'Pet11'];
  const allBattles: any[][] = [[], [], [], [], [], [], [], [], [], []];
  const { familiarsOwned } = (rawSummon?.[4] ?? []).reduce((acc: any, currentValue: any, index: any) => {
    acc.familiarsOwned += acc.multiplier * currentValue;
    acc.multiplier *= index + 3;
    return acc;
  }, { familiarsOwned: 0, multiplier: 1 });
  // game: SummonStuff "i", each familiar of tier t pays 10 * prod(4 + k, k < t) EXP per hour (gem familiars pay none)
  const { familiarsExpPerHour } = (rawSummon?.[4] ?? []).reduce((acc: any, count: any, tier: any) => {
    acc.familiarsExpPerHour += acc.multiplier * (Number(count) || 0);
    acc.multiplier *= tier + 4;
    return acc;
  }, { familiarsExpPerHour: 0, multiplier: 10 });
  const careerWins: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  whiteBattleOrder.forEach((enemyId, index) => {
    const monsterData = getSummoningBattle(enemyId);
    if (monsterData) {
      const extraData = getBattleData(enemyId, monsterData, wonBattles);
      allBattles[0].push({ ...monsterData, ...extraData, icon: monsterSprite(whiteBattleIcons?.[index]) });
    }
  });
  // 9 === this._GenINFO[146]
  deathNote.forEach(({ rawName, world }) => {
    const monsterData = getSummoningBattle(rawName);
    if (monsterData) {
      const extraData = getBattleData(rawName, monsterData, wonBattles);
      allBattles[world + 1].push({ ...monsterData, ...extraData });
    }
  })

  let rawWinnerBonuses = wonBattles?.reduce((acc: any, enemyId: any) => {
    const monsterData = summoningEnemies.find((enemy) => enemy.enemyId === enemyId);
    if (typeof monsterData?.bonusId === 'number' && monsterData.bonusId < 20) {
      const bonus = summoningBonuses.find((bonus) => bonus.bonusId === monsterData.bonusId);
      if (bonus) {
        if (acc[monsterData.bonusId]) {
          acc[monsterData.bonusId] += Number(monsterData.bonusQty);
        }
        else {
          acc[monsterData.bonusId] = Number(monsterData.bonusQty);
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
    const tree = getWinnerBonusTree(rawWinnerBonuses, account, index);
    const value = evaluateBreakdown(createBreakdown('', 0, tree));

    return {
      bonusId,
      bonus,
      value,
      baseValue: rawValue,
      breakdown: createBreakdown('Winner bonus', value, tree)
    };
  });

  const gambitStuff = account?.hole?.holesObject?.gambitStuff;
  // game: Summoning("SummUpgBonus") = level * qty * multi. A doubled upgrade's multi is
  // 2 + ABSOLUTE_STARDOM past 100% + Allstar (78); a Summoning stone trial cleared for the
  // upgrade's colour multiplies it again, for upgrades flagged in column 10 (`filler`).
  const absoluteStardom = getHighestTalentAcrossCharacters(characters, 'ABSOLUTE_STARDOM', getBestActiveCharacter(characters));
  const doubledBase = 2 + Math.max(0, absoluteStardom / 100 - 1);
  const isDoubled = (index: number) => !!gambitStuff?.includes(index);
  const allstar = (upgradesLevels?.[78] ?? 0) * (summoningUpgrades[78]?.bonusQty ?? 0) * (isDoubled(78) ? doubledBase : 1);
  let upgrades = summoningUpgrades.map((upgrade, index) => {
    const doubled = isDoubled(index);
    const level = upgradesLevels?.[index] ?? 0;
    const stoneTrials = Number(killRoyKills?.[`SummzTrz${upgrade.colour}`]) || 0;
    const multi = (doubled ? doubledBase + allstar / 100 : 1)
      * (stoneTrials > 0 && Number(upgrade.filler) === 1 ? 1 + stoneTrials : 1);
    return {
      ...upgrade,
      originalIndex: index,
      level,
      value: level * upgrade.bonusQty * multi,
      doubled
    }
  });
  // game: "Summoning:UpgCost". ESSENTIAL_ESSENCE scales with every upgrade level bought, Cost
  // Laundering with each full 100 of them.
  const essentialEssence = getHighestTalentAcrossCharacters(characters, 'ESSENTIAL_ESSENCE', getBestActiveCharacter(characters));
  upgrades = upgrades.map((upgrade, index) => {
    const costCrashing = upgrades.find(({ originalIndex }) => originalIndex === 49);
    const costDeflation = upgrades.find(({ originalIndex }) => originalIndex === 57);
    const sellSellSell = upgrades.find(({ originalIndex }) => originalIndex === 72);
    const costLaundering = upgrades.find(({ originalIndex }) => originalIndex === 75);
    const tesseractBonus = getTesseractBonus(account, 54) * highestEndlessLevel;
    const cost = (1 / (1 + (essentialEssence * Math.max(0, totalUpgradesLevels / 100)) / 100))
      * (1 / (1 + (costCrashing?.value ?? 0) / 100))
      * (1 / (1 + getJellyBonus(account, 27) / 100))
      * Math.max(0.1, 1 - Math.max(getSushiBonus(account, 9), getSushiBonus(account, 34)) / 100)
      * (1 / (1 + tesseractBonus / 100))
      * (1 / (1 + (costDeflation?.value ?? 0) / 100))
      * (1 / (1 + (sellSellSell?.value ?? 0) / 100))
      * getSumCostReduxMena(account, upgrade?.level)
      * (1 / (1 + ((costLaundering?.value ?? 0) * Math.max(0, Math.floor(totalUpgradesLevels / 100))) / 100))
      * upgrade?.cost
      * Math.pow(upgrade?.costExponent, upgrade?.level);
    // The panel rounds a cost up below gameTables.summoningUpgradeCostDisplay.ceilBelow, for the price it prints and
    // the essence check alike
    const { ceilBelow } = gameTables.summoningUpgradeCostDisplay;
    return { ...upgrade, totalCost: cost < ceilBelow ? Math.ceil(cost) : cost }
  });
  const armyHealthTree = getArmyHealthTree(upgrades, totalUpgradesLevels, highestEndlessLevel);
  const armyDamageTree = getArmyDamageTree(upgrades, totalUpgradesLevels, highestEndlessLevel);
  const armyHealth = evaluateBreakdown(createBreakdown('', 0, armyHealthTree));
  const armyDamage = evaluateBreakdown(createBreakdown('', 0, armyDamageTree));
  upgrades = updateTotalBonuses(upgrades, careerWins, characters, highestEndlessLevel, armyDamage);
  upgrades = groupByKey(upgrades, ({ colour }: any) => colour);

  const stoneMapsIds = {
    0: 256, // Bamboo Laboredge
    1: 257, // Lightway Path
    2: 262, // Yolkrock Basin
    3: 120, // Equinox Valley
    4: 157, // Jelly Cube Bridge
    5: 212, // Crawly Catacombs
    6: 264, // Emperor's Castle Doorstep
  }

  const summoningStones = Object.keys(stoneNames).map(Number)
    .map((index) => {
      const killsNum = Number(killRoyKills?.[`SummzTrz${index}`]) || 0;
      const enemy = summoningEnemies[106 + index] as any;
      const isBoss6 = enemy?.enemyId === 'Boss6';
      const rawName = isBoss6 ? 'Boss6A' : enemy?.enemyId
      const monsterName = monsters?.[rawName]?.Name;
      const bossHp = 2 * (enemy?.hp ?? 0) * Math.pow(4000, killsNum);
      const nextLevelHps = createRange(killsNum + 1, killsNum + 14).map((futureKills: any) => {
        return 2 * (enemy?.hp ?? 0) * Math.pow(4000, futureKills)
      })

      const mapMonsterName = monsters?.[(mapEnemiesArray as any)[(stoneMapsIds as any)[index]]]?.Name;
      return {
        name: enemy?.territoryName,
        monsterIcon: isBoss6 ? `data/${enemy?.enemyId}.png` : monsterSprite(monsterName),
        stoneName: (stoneNames as Record<number, string>)[index],
        kills: killsNum,
        index,
        bonus: `${(summonEssenceColor as Record<number, string>)[index]}_` + Math.max(2, 1 + killsNum) + 'x_higher_bonuses',
        bossHp,
        nextLevelHps,
        mapName: (mapNames as any)[(stoneMapsIds as any)[index]],
        mapMonsterName: mapMonsterName,
        mapMonsterIcon: mapMonsterName ? monsterSprite(mapMonsterName) : null
      }
    });
  const totalSummoningStonesKills = summoningStones.reduce((sum, { kills }) => sum + kills, 0);
  // game: the Familiar upgrade's "|", ShopRestock + 86400 * Summon[3][3] seconds from the save
  const familiarCostResetSeconds = (Number(account?.timeAway?.ShopRestock) || 0) + 86400 * (Number(summoningStuff?.[3]) || 0);
  return {
    familiarCostResetSeconds,
    upgrades,
    winnerBonuses,
    essences,
    totalUpgradesLevels,
    familiarsOwned,
    familiarsExpPerHour,
    allBattles,
    armyHealth,
    armyDamage,
    armyHealthBreakdown: createBreakdown('Army health', armyHealth, armyHealthTree),
    armyDamageBreakdown: createBreakdown('Army damage', armyDamage, armyDamageTree),
    summoningStuff,
    highestEndlessLevel,
    totalWins: allBattles?.flat()?.reduce((sum, { won }) => sum + (won ? 1 : 0), 0) + highestEndlessLevel,
    summoningStones,
    totalSummoningStonesKills,
    upgradesLevels: upgradesLevels ?? [],
    careerWins
  }
}

export const getEndlessBattles = (battles = 100, highestEndlessLevel: any, winnerBonuses: any) => {
  const endlessBattles = [];
  for (let i = 0; i < highestEndlessLevel + battles; i++) {
    const index = i % 40;
    const difficultyIndex = getEndlessModifier(i, 0, 0);
    const bonusId = Number(summoningEndless.bonusIds?.[index]);
    const bonus = structuredClone(summoningBonuses?.[bonusId - 1]);
    const bonusQty = Number(summoningEndless.bonusQuantities[index]) * (1 + (winnerBonuses?.[31]?.value ?? 0) / 100);
    const actualBonus = bonus?.bonus?.includes('<')
      ? (1 + bonusQty / 100)
      : (bonusQty);
    bonus.bonus = bonus?.bonus?.replace(/[<{]/, gameFill(actualBonus, bonus?.bonus?.includes('<') ? 'MultiplierInfo' : 'Big'));
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
      icon: `etc/${monster?.enemyId}_monster.png`
    });
  }
  return endlessBattles;
}
const getEndlessModifier = (endlessLevel: any, t: any, i: any): any => {
  return 99 === i
    ? (t === getEndlessModifier(endlessLevel, 0, 0) ? 1 : 0)
    : summoningEndless.difficulties[Math.round(endlessLevel - 40 * Math.floor(endlessLevel / 40))]
}

// The game rebuilds every artifact bonus in index order, so artifacts before The Winz Lantern (32) that
// read a winner bonus see it without the lantern
export const getWinnerBonusWithoutLantern = (account: any, index: number) =>
  getLocalWinnerBonus(account?.summoning?.winnerBonuses?.map(({ baseValue }: any) => baseValue), account, index, true);

// Winner bonuses that read their raw sum, untouched by any multiplier
const RAW_WINNER_BONUSES = [20, 22, 24, 31];
const WINNER_BONUS_MULTI = 31;
const LIBRARY_WINNER_BONUS = 19;

const getWinnerBonusTree = (rawWinnerBonuses: any, account: any, index: number, ignoreLantern = false): BreakdownNode[] => {
  const rawValue = rawWinnerBonuses?.[index] || 0;
  if (RAW_WINNER_BONUSES.includes(index)) return [flat('Base', rawValue)];
  // Library Max skips the Emperor and the Winner Bonuses multiplier; the 20 to 33 bonuses skip the 3.5x base
  const fullBracket = index !== LIBRARY_WINNER_BONUS;
  const baseScale = index > LIBRARY_WINNER_BONUS && index <= 33 ? 1 : 3.5;
  const { bonusPerLevel, level } = account?.meritsDescriptions?.[5]?.[4] ?? {};
  const gemShopBonus = account?.gemShopPurchases?.[11] ?? 0;
  return [
    flat('Base', baseScale * rawValue),
    multiplier('Crystal Comb (Pristine charm)', 1 + getCharmBonus(account, 'Crystal_Comb') / 100),
    multiplier('King of All Winners (Gem shop)', 1 + (10 * gemShopBonus) / 100),
    additiveGroup(NUMBERED_GROUP, [
      percent('The Winz Lantern (Artifact)', ignoreLantern ? 0 : isArtifactAcquired(account?.sailing?.artifacts, 'The_Winz_Lantern')?.bonus ?? 0),
      percent('Merit', Math.min(10, (level ?? 0) * bonusPerLevel || 0)),
      percent('Regalis My Beloved (Achievement)', getAchievementStatus(account?.achievements, 373)),
      percent('Spectre Stars (Achievement)', getAchievementStatus(account?.achievements, 379)),
      percent('Godshard set', getArmorSetBonus(account, 'GODSHARD_SET')),
      // game: Thingies("Have_ban_i"), a flat 50 in the same bracket
      percent('Verminous (Bundle)', isBundlePurchased(account, 'ban_i') ? 50 : 0),
      ...(fullBracket ? [
        percent('Emperor', getEmperorBonus(account, 8)),
        percent('Winner Bonuses (Winner bonus)', getLocalWinnerBonus(rawWinnerBonuses, account, WINNER_BONUS_MULTI))
      ] : [])
    ])
  ];
}

const getLocalWinnerBonus = (rawWinnerBonuses: any, account: any, index: number, ignoreLantern = false): number =>
  evaluateBreakdown(createBreakdown('', 0, getWinnerBonusTree(rawWinnerBonuses, account, index, ignoreLantern)));
const getLocalSummoningBonus = (upgrades: any, index: any) => {
  return upgrades.find(({ originalIndex }: any) => originalIndex === index)?.value || 0
}
const getStoneBossHp = ({ type, kills }: any) => {

  return 2 * (summoningEnemies[type] as any) * Math.pow(4000, kills);
}
// game: Summoning("UnitHP", -1)
const getArmyHealthTree = (upgrades: any, totalUpgradesLevels: number, highestEndlessLevel: number): BreakdownNode[] => {
  const bonus = (index: number) => getLocalSummoningBonus(upgrades, index);
  return [
    sumGroup(NUMBERED_GROUP, [flat('Base', 1), ...[1, 10, 35, 37].map((index) => flat(upgradeName(index), bonus(index)))]),
    additiveGroup(NUMBERED_GROUP, [20, 81].map((index) => percent(upgradeName(index), bonus(index)))),
    additiveGroup(NUMBERED_GROUP, [
      percent(upgradeName(50), bonus(50)),
      percent(upgradeName(59), bonus(59)),
      percent(upgradeName(63), bonus(63) * highestEndlessLevel)
    ]),
    multiplier(upgradeName(61), 1 + bonus(61) * Math.max(0, Math.floor(totalUpgradesLevels / 100)) / 100)
  ];
}
// game: Summoning("UnitDMG", -1). Seeing Red (47) and upgrade 76 count battle state, so they stay 1x off the field.
const getArmyDamageTree = (upgrades: any, totalUpgradesLevels: number, highestEndlessLevel: number): BreakdownNode[] => {
  const bonus = (index: number) => getLocalSummoningBonus(upgrades, index);
  return [
    sumGroup(NUMBERED_GROUP, [flat('Base', 1), ...[3, 12, 21, 31].map((index) => flat(upgradeName(index), bonus(index)))]),
    additiveGroup(NUMBERED_GROUP, [43, 74].map((index) => percent(upgradeName(index), bonus(index)))),
    additiveGroup(NUMBERED_GROUP, [
      percent(upgradeName(51), bonus(51)),
      percent(upgradeName(56), bonus(56)),
      percent(upgradeName(64), bonus(64) * highestEndlessLevel)
    ]),
    multiplier(upgradeName(60), 1 + bonus(60) * Math.max(0, Math.floor(totalUpgradesLevels / 100)) / 100)
  ];
}
// An enemy is a battle once it has a win bonus; the list runs ahead of the bonuses with enemies not released yet.
const getSummoningBattle = (enemyId: any) => summoningEnemies.find((enemy) => enemy.enemyId === enemyId && enemy.bonusId !== '_');

const getBattleData = (enemyId: any, monsterData: any, wonBattles: any) => {
  const icon = monsterSprite(enemyId, 'face');
  const won = wonBattles?.includes(enemyId);
  const { bonus, bonusId } = summoningBonuses.find((bonus) => bonus.bonusId === monsterData.bonusId)!;
  const base = 3.5 * monsterData?.bonusQty;
  const actualBonus = bonus.includes('<') ? gameFill(1 + base / 100, 'MultiplierInfo') : gameFill(base, 'Big');
  const resultBonus = { bonusId, bonus: bonus.replace(/[<{]/, '' + actualBonus) };
  return {
    bonus: resultBonus,
    won,
    icon
  }
}

export const getWinnerBonus = (account: any, bonusName: any, _unused2?: any) => {
  return account?.summoning?.winnerBonuses?.find(({ bonus }: any) => bonus === bonusName)?.value ?? 0;
}

export const getSummoningUpgradeBonus = (account: any, upgradeIndex: number) => {
  const grouped = account?.summoning?.upgrades;
  if (!grouped) return 0;
  for (const group of Object.values(grouped)) {
    const found = (group as any[])?.find?.((u: any) => u?.originalIndex === upgradeIndex);
    if (found) return found.value || 0;
  }
  return 0;
}

// game: the upgrade panel's "}" (Total bonus). The level scaled upgrades read Lv0[18], the logged-in character's
// summoning level.
const updateTotalBonuses = (upgrades: any, careerWins: any, characters: any[], highestEndlessLevel: any, armyDamage: number) => {
  const summoningLevel = characters?.length ? getLoggedInSkillLevel(characters, 'summoning') : 1;
  const allWins: any = Object.values(careerWins).reduce((sum: any, wins: any) => sum + wins, 0);
  const totalUpgrades = upgrades.reduce((sum: any, { level }: any) => sum + level, 0);
  return upgrades.map((upgrade: any) => {
    let totalBonus: any = '';
    switch (upgrade.originalIndex) {
      // SummVictories(0): every career win, endless included
      case 0:
        totalBonus = upgrade.value * (allWins + highestEndlessLevel);
        break;
      case 11:
        totalBonus = upgrade.value * careerWins[1];
        break;
      case 18:
        totalBonus = upgrade.value * careerWins[2];
        break;
      case 27:
        totalBonus = upgrade.value * careerWins[3];
        break;
      case 38:
        totalBonus = upgrade.value * careerWins[4];
        break;
      case 46:
        totalBonus = upgrade.value * careerWins[5];
        break;
      case 54:
        totalBonus = upgrade.value * careerWins[6];
        break;
      case 73:
        totalBonus = upgrade.value * careerWins[7];
        break;
      // The cost cut, as the % the panel prints
      case 49:
      case 57:
      case 72:
        totalBonus = Math.round(1e4 * (1 - 1 / (1 + upgrade.value / 100))) / 100;
        break;
      case 30:
      case 40:
      case 65:
      case 66:
      case 67:
      case 52:
      case 58:
      case 80:
        totalBonus = upgrade.value * summoningLevel;
        break;
      // Per full 100 upgrade levels
      case 60:
      case 61:
        totalBonus = Math.round(upgrade.value * Math.floor(totalUpgrades / 100));
        break;
      case 62:
      case 63:
      case 64:
        totalBonus = Math.round(upgrade.value * highestEndlessLevel);
        break;
      // Spike damage: a share of UnitDMG(-1)
      case 68:
        totalBonus = armyDamage * (upgrade.value / 100);
        break;
      // The cost cut per full 100 upgrade levels, as the % the panel prints
      case 75:
        totalBonus = Math.round(1e4 * (1 - 1 / (1 + upgrade.value * Math.floor(totalUpgrades / 100) / 100))) / 100;
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

// The cost cuts, which the panel prints as an already rounded %
const PLAIN_TOTAL_UPGRADES = [49, 57, 72, 75];

// game: the upgrade panel's text, every occurrence replaced (StringTools.replace). { is CommaNotation(bonus),
// > is round(100 + bonus) / 100, } is the total and "@" is a line break. "|" (the familiar cost reset) is left for
// the page to fill.
export const getSummoningUpgradeText = ({ bonus, value, totalBonus, originalIndex }: any): string => {
  const total = PLAIN_TOTAL_UPGRADES.includes(originalIndex) ? totalBonus : gameFill(totalBonus, 'Comma');
  const text = String(bonus ?? '')
    .split('{').join(gameFill(value, 'Comma'))
    .split('>').join(String(Math.round(100 + value) / 100))
    .split('}').join(String(total));
  return (cleanUnderscore(text) ?? '').split('@').map((line) => line.trim()).join('\n');
}

// game: Summoning("SummRockEssGen", colour), essence per hour from each summoning rock
const BASE_ESSENCE_PER_HOUR = 10;
// GemItemsPurchased[137], the Shroom Familiar: x1.4 per purchase
const SHROOM_FAMILIAR_GEM_INDEX = 137;
const SHROOM_FAMILIAR_MULTI = 1.4;
const ALL_ESSENCE_CHARM = 'Stick_of_Chew';
const ALL_ESSENCE_WINNER_BONUS = '<x All Essence';
const ALL_ESSENCE_GAMBIT = 5;
const ESSENCE_MENAGERIE_BOOST = 14;
// RiftStuff("RiftSkillBonus,17", 1): summoning's second mastery tier, +10%
const ESSENCE_MASTERY_TIER = 1;
const ESSENCE_MASTERY_PERCENT = 10;
const INFINITE_ESSENCE_UPGRADE = 62;
const ESSENCE_ACHIEVEMENTS = [372, 374];
const ESSENCE_ACHIEVEMENT_PERCENT = 5;
const ESSENCE_VOTE = 28;
const ESSENCE_SLAB = 5;
const ESSENCE_STATUE = 27;
const ESSENCE_ARCADE = 34;
const WHITE_ESSENCE_VAULT = 83;
const COLOUR_ESSENCE_VAULT = 87;
// Spelunk("DoWeHaveLoreN1", 4): the teal rock needs this cave's lore
const TEAL_ROCK_LORE_CAVE = 4;
// TalentCalc: each ESSENCE_BOOST bubble grows with the class levels of its class line, 1 + 4L / (L + 1000)
const ESSENCE_BOOST_SCALE = 4;
const ESSENCE_BOOST_HALF_LEVEL = 1000;
const CLASS_LINE_RANGES = {
  warrior: [6, 18],
  archer: [18, 30],
  mage: [30, 42]
} as const;

type ClassLine = keyof typeof CLASS_LINE_RANGES;

interface EssenceColourInfo {
  // Summoning upgrades: % per summoning level, % per career win of the colour
  knowledge: number;
  victories: number;
  // The colour's "<Colour> Summoning" upgrade: its first level also unlocks the rock
  summoning?: number;
  bubble?: { cauldron: string, name: string, classLine?: ClassLine };
  stamp?: string;
}

// Indexed by essence colour; white's own bonuses are added in getEssenceGain
const ESSENCE_COLOURS: EssenceColourInfo[] = [
  { knowledge: 65, victories: 0, stamp: 'WhiteEss' },
  { knowledge: 66, victories: 11, summoning: 4, stamp: '123Ess', bubble: { cauldron: 'quicc', name: 'ESSENCE_BOOST', classLine: 'archer' } },
  { knowledge: 67, victories: 18, summoning: 13, stamp: '123Ess', bubble: { cauldron: 'kazam', name: 'ESSENCE_BOOST' } },
  { knowledge: 30, victories: 27, summoning: 23, stamp: '123Ess' },
  { knowledge: 40, victories: 38, summoning: 33, stamp: '456Ess', bubble: { cauldron: 'high-iq', name: 'ESSENCE_BOOST', classLine: 'mage' } },
  { knowledge: 52, victories: 46, summoning: 44, stamp: '456Ess', bubble: { cauldron: 'power', name: 'ESSENCE_BOOST', classLine: 'warrior' } },
  { knowledge: 58, victories: 54, summoning: 53, stamp: '456Ess' },
  { knowledge: 80, victories: 73 }
];

const upgradeName = (index: number) => (summoningUpgrades[index]?.name ?? '').replace(/_/g, ' ');

const getClassLineLevels = (characters: any[], classLine: ClassLine) => {
  const [from, to] = CLASS_LINE_RANGES[classLine];
  return characters?.reduce((sum, { classIndex, level }) => classIndex >= from && classIndex < to
    ? sum + (level || 0)
    : sum, 0) ?? 0;
};

const getEssenceBoostBubble = (account: any, characters: any[], bubble: EssenceColourInfo['bubble']) => {
  if (!bubble) return 0;
  // The four ESSENCE_BOOST bubbles share one name, so each colour reads its own cauldron's copy
  const base = getBubbleBonus(account, bubble.name, false, undefined, bubble.cauldron);
  if (!bubble.classLine) return base;
  const levels = getClassLineLevels(characters, bubble.classLine);
  return base * (1 + ESSENCE_BOOST_SCALE * levels / (levels + ESSENCE_BOOST_HALF_LEVEL));
};

// DNSM.SumAllEss: the multiplier every colour shares
const getAllEssenceGroup = (account: any) => {
  const holesObject = account?.hole?.holesObject;
  const highestEndlessLevel = account?.accountOptions?.[OPT.summoningHighestEndless] ?? 0;
  const masteryUnlocked = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.summoning?.rank, ESSENCE_MASTERY_TIER);
  const essenceChapter = getBubbleBonus(account, 'ESSENCE_CHAPTER') * getTomeBubbleMulti(account?.tome?.totalPoints ?? 0);
  return productGroup('All essence bonuses', [
    multiplier('Winner bonus', 1 + getWinnerBonus(account, ALL_ESSENCE_WINNER_BONUS) / 100),
    multiplier('Lamp', 1 + getLampBonus({ holesObject, t: 2, i: 2, account }) / 100),
    multiplier('Gambit', 1 + getGambitBonus(account, ALL_ESSENCE_GAMBIT) / 100),
    multiplier('Menagerie Boost', 1 + getMenagerieBoost(account, ESSENCE_MENAGERIE_BOOST) / 100),
    multiplier('Shroom Familiar (Gem shop)', Math.pow(SHROOM_FAMILIAR_MULTI, account?.gemShopPurchases?.[SHROOM_FAMILIAR_GEM_INDEX] ?? 0)),
    multiplier('Stick of Chew (Pristine charm)', 1 + getCharmBonus(account, ALL_ESSENCE_CHARM) / 100),
    multiplier('Fountain', 1 + getFountainBonusTotal(holesObject, 1, 17) / 100),
    multiplier('Monument', 1 + getMonumentBonus({ holesObject, t: 1, i: 4 }) / 100),
    multiplier('Skill mastery', 1 + ESSENCE_MASTERY_PERCENT * masteryUnlocked / 100),
    multiplier(upgradeName(INFINITE_ESSENCE_UPGRADE), 1 + getSummoningUpgradeBonus(account, INFINITE_ESSENCE_UPGRADE) * highestEndlessLevel / 100),
    additiveGroup(NUMBERED_GROUP, [
      percent('Essence Chapter (Bubble)', essenceChapter),
      percent('Meal', getMealsBonusByEffectOrStat(account, null, 'zSumEss')),
      percent('Totalizer', getTotalizerBonuses(account)?.essence?.value ?? 0),
      percent('Slab', getSlabBonus(account, ESSENCE_SLAB))
    ]),
    additiveGroup('Achievements', ESSENCE_ACHIEVEMENTS.map((index) =>
      percent(`Achievement ${index}`, ESSENCE_ACHIEVEMENT_PERCENT * getAchievementStatus(account?.achievements, index)))),
    multiplier('Vote', 1 + getVoteBonus(account, ESSENCE_VOTE) / 100)
  ]);
};

export interface EssenceGain {
  index: number;
  colour: string;
  unlocked: boolean;
  value: number;
  breakdown: StatBreakdown | null;
}

// game: Summoning("SummRockUnlocked", colour)
const isRockUnlocked = (account: any, colour: number) => {
  if (colour === 0) return true;
  const { summoning } = ESSENCE_COLOURS[colour];
  if (summoning !== undefined) return (account?.summoning?.upgradesLevels?.[summoning] ?? 0) >= 1;
  return !!account?.spelunking?.loreBosses?.find(({ index }: any) => index === TEAL_ROCK_LORE_CAVE)?.defeated;
};

// game: Summoning("SummRockEssGen", colour), per hour. The level scaled upgrades read Lv0[18], the
// logged-in character's summoning level.
export const getEssenceGain = (account: any, characters: any[] = []): EssenceGain[] => {
  const summoningLevel = characters?.length ? getLoggedInSkillLevel(characters, 'summoning') : 0;
  const careerWins = account?.summoning?.careerWins ?? {};
  const allEssence = getAllEssenceGroup(account);
  const vaultUpgrades = account?.upgradeVault?.upgrades;
  return ESSENCE_COLOURS.map(({ knowledge, victories, summoning, bubble, stamp }, index) => {
    const colour = (summonEssenceColor as Record<number, string>)[index];
    const unlocked = isRockUnlocked(account, index);
    if (!unlocked) return { index, colour, unlocked, value: 0, breakdown: null };
    // SummVictories(0) is every career win, endless included
    const wins = index === 0 ? account?.summoning?.totalWins ?? 0 : careerWins?.[index] ?? 0;
    const stampBonus = stamp ? getStampsBonusByStat(account, stamp) ?? 0 : 0;
    const colourBonuses = index === 0
      ? [
        additiveGroup(NUMBERED_GROUP, [
          percent('Vial', getVialsBonusByStat(account?.alchemy?.vials, '6WhiteEss') ?? 0),
          percent('Statue', getStatueBonus(account, ESSENCE_STATUE)),
          percent('Arcade', getArcadeBonus(account?.arcade?.shop, ESSENCE_ARCADE)?.bonus ?? 0),
          percent('Upgrade vault', getUpgradeVaultBonus(vaultUpgrades, WHITE_ESSENCE_VAULT))
        ]),
        multiplier(getStampLineName(account, { stat: stamp }), 1 + stampBonus / 100)
      ]
      : [
        additiveGroup(NUMBERED_GROUP, [
          ...(stamp ? [getStampNode(account, { stat: stamp }, stampBonus)] : []),
          percent('Upgrade vault', getUpgradeVaultBonus(vaultUpgrades, COLOUR_ESSENCE_VAULT))
        ])
      ];
    const tree = [
      flat('Base', BASE_ESSENCE_PER_HOUR),
      allEssence,
      multiplier(upgradeName(knowledge), 1 + getSummoningUpgradeBonus(account, knowledge) * summoningLevel / 100),
      ...(bubble ? [multiplier('Essence Boost (Bubble)', 1 + getEssenceBoostBubble(account, characters, bubble) / 100)] : []),
      multiplier(upgradeName(victories), 1 + wins * getSummoningUpgradeBonus(account, victories) / 100),
      ...(summoning !== undefined ? [multiplier(upgradeName(summoning), 1 + getSummoningUpgradeBonus(account, summoning) / 100)] : []),
      ...colourBonuses
    ];
    const statName = `${colour.charAt(0).toUpperCase()}${colour.slice(1)} essence per hour`;
    const value = evaluateBreakdown(createBreakdown(statName, 0, tree));
    return { index, colour, unlocked, value, breakdown: createBreakdown(statName, value, tree) };
  });
};

// Summon[3][1] banks seconds (offline too); the claim needs a full hour and the Summoning skill
// selected on the summoning node. Per-character EXP terms read the logged-in character.
export const FAMILIAR_EXP_MIN_CLAIM_SECONDS = 3600;

export interface FamiliarExp {
  savedSeconds: number;
  expPerHour: number;
  expMulti: number;
  expMultiBreakdown: StatBreakdown | null;
}

export const getFamiliarExp = (account: any, expMulti: { value: number, breakdown: StatBreakdown } | undefined): FamiliarExp => {
  const familiarsExpPerHour = account?.summoning?.familiarsExpPerHour ?? 0;
  const multi = expMulti?.value ?? 1;
  return {
    savedSeconds: Number(account?.summoning?.summoningStuff?.[1]) || 0,
    expPerHour: familiarsExpPerHour * multi,
    expMulti: multi,
    expMultiBreakdown: expMulti?.breakdown ?? null
  };
};

// game: IncreaseExpREQ, the Summoning arm (ExpReq0[18]), gameTables.summoningExpReq
export const getSummoningExpReq = (level: number) => {
  const { base, power, linear, growth, growthCap, growthScale, growthOffset, offset } = gameTables.summoningExpReq;
  return (base + Math.pow(level, power) + linear * level)
    * Math.pow(growth - Math.min(growthCap, growthScale * level / (level + growthOffset)), level) - offset;
};

export interface FamiliarLevelGain {
  name: string;
  level: number;
  newLevel: number;
}

// The claim hands the same EXP to every character, each levelling from its own Summoning level and EXP.
export const getFamiliarLevelGains = (characters: any[] | undefined, exp: number): FamiliarLevelGain[] =>
  (characters ?? []).map((character) => {
    const { level = 0, exp: currentExp = 0 } = character?.skillsInfo?.summoning || {};
    let remaining = (currentExp || 0) + exp;
    let newLevel = level;
    let req = getSummoningExpReq(newLevel);
    while (req > 0 && remaining >= req && newLevel - level < 1000) {
      remaining -= req;
      newLevel++;
      req = getSummoningExpReq(newLevel);
    }
    return { name: character?.name, level, newLevel };
  });

export const getPendingFamiliarExp = (familiarExp: FamiliarExp | undefined, lastUpdated?: number, now = Date.now()) => {
  const sinceSave = lastUpdated ? Math.max(0, (now - lastUpdated) / 1000) : 0;
  const seconds = (familiarExp?.savedSeconds ?? 0) + sinceSave;
  return {
    seconds,
    exp: seconds / 3600 * (familiarExp?.expPerHour ?? 0),
    claimable: seconds >= FAMILIAR_EXP_MIN_CLAIM_SECONDS
  };
};
