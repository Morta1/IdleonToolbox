import { growth, tryToParse } from '../utility/helpers';
import { chips, classes, jewels, labBonuses, merits, randomList, talents } from '../data/website-data';
import { getMealsBonusByEffectOrStat } from './cooking';
import { getCardBonusByEffect } from './cards';
import { isArenaBonusActive, isCompanionBonusActive, isMasteryBonusUnlocked } from './misc';
import { getShinyBonus } from './breeding';
import { checkCharClass, CLASSES, getHighestTalentByClass, getTalentBonus } from './talents';
import { getEquinoxBonus } from './equinox';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { calculateItemTotalAmount, getStatsFromGear } from '@parsers/items';
import { getAllBaseSkillEff, getAllEff } from '@parsers/efficiency';
import { getObolsBonus } from '@parsers/obols';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getPostOfficeBonus } from '@parsers/postoffice';

export const getLab = (idleonData, charactersData, account, updatedCharactersData) => {
  const labRaw = tryToParse(idleonData?.Lab) || idleonData?.Lab;
  return parseLab(labRaw, charactersData, account, updatedCharactersData);
}

const parseLab = (labRaw, charactersData, account, updatedCharactersData) => {
  if (!labRaw) return {}
  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const [cords] = labRaw;
  const chipRepo = labRaw[15];
  const jewelsRaw = labRaw[14];
  const currentRotation = labRaw[13];
  const playerChipsRaw = labRaw?.slice(1, charactersData?.length + 1);
  let playerCordsChunk = 2, playersCords = [];
  for (let i = 0; i < cords.length; i += playerCordsChunk) {
    const [x, y] = cords.slice(i, i + playerCordsChunk);
    playersCords = [...playersCords, {
      x: Math.round(x),
      y: Math.round(y),
      playerId: i / 2,
      playerName: charactersData?.[i / 2]?.name,
      class: classes[charactersData?.[i / 2]?.CharacterClass]
    }];
  }
  playersCords = playersCords?.filter((player) => player?.playerName);
  let jewelsList = account?.lab?.jewels || jewelsRaw?.map((jewel, index) => {
    return {
      ...(jewels?.[index] || {}),
      acquired: jewel === 1,
      rawName: `ConsoleJwl${index}`
    }
  }).filter(({ name }) => name);

  const playersChips = playerChipsRaw?.map((pChips) => {
    return pChips.map((chip) => {
      if (chips?.[chip]) return { ...chips?.[chip], chipIndex: chip }
      return chip;
    });
  });
  const soupedUpSlots = (account?.gemShopPurchases?.find((value, index) => index === 123) ?? 0) * 2;
  const holeMajikConnected = account?.hole?.godsLinks?.find(({ index }) => index === 1);
  let playersInTubes = [...charactersData].filter((character, index) => isCompanionBonusActive(account, 0) || holeMajikConnected || character?.AFKtarget === 'Laboratory' ||
    isLabEnabledBySorcererRaw(character, 1) || account?.divinity?.linkedDeities?.[index] === 1)
    .map((character) => ({
      ...character,
      x: playersCords?.[character?.playerId]?.x,
      y: playersCords?.[character?.playerId]?.y
    }));

  const chipList = structuredClone(chips);
  chipRepo?.map((chipCount, chipIndex) => {
    if (chipIndex < chips.length) {
      const playerUsedCount = playersChips.flatMap(chips => chips).reduce((sum, chip) => sum + (chip.index === chipList[chipIndex].index
        ? 1
        : 0), 0);
      chipList[chipIndex].repoAmount = chipCount - playerUsedCount;
      chipList[chipIndex].amount = playerUsedCount;
    }
  });
  const calculatedTaskConnectionRange = (account?.tasks?.[2]?.[3]?.[4] ?? 0) * merits?.[3]?.[4]?.bonusPerLevel;
  const buboPlayers = charactersData.filter(({ CharacterClass }) => CharacterClass === 36);
  let buboPlayer = buboPlayers?.reduce((prev, current) => {
    return prev?.SkillLevels[536] > current?.SkillLevels[536] ? prev : current;
  }, buboPlayers?.[0]);
  if (buboPlayer) {
    buboPlayer = { ...buboPlayer, ...playersCords?.[buboPlayer?.playerId] }
  }

  const equinoxConnectionRangeBonus = getEquinoxBonus(account?.equinox?.upgrades, 'Laboratory_Fuse');
  const winnerBonus = getWinnerBonus(account, '+{ Lab Con Range');

  let foundNewConnection = true;
  let counter = 0;
  let labBonusesList = structuredClone(labBonuses);
  let connectedPlayers = [];
  while (foundNewConnection) {
    foundNewConnection = false;
    counter += 1;
    playersInTubes = calcPlayerLineWidth(playersInTubes, labBonusesList, jewelsList,
      playersChips, account, account?.cards, account?.gemShopPurchases, arenaWave, waveReqs, buboPlayer, charactersData, updatedCharactersData);

    if (playersInTubes.length > 0 && connectedPlayers.length === 0) {
      const prismPlayer = getPrismPlayerConnection(playersInTubes);
      if (prismPlayer) {
        connectedPlayers.push(prismPlayer);
      }
    }

    for (let i = 0; i < playersInTubes.length; i++) {
      let newPlayer, newPlayerConnection;
      if (i < connectedPlayers.length) {
        newPlayer = checkPlayerConnection(playersInTubes, connectedPlayers, connectedPlayers?.[i]);
        if (newPlayer && !connectedPlayers.find((player) => player.playerId === newPlayer.playerId)) {
          newPlayerConnection = true;
          connectedPlayers = [...connectedPlayers, newPlayer];
        }
        if (i === 6) {

        }
        const spelunkerObolMulti = getLabBonus(labBonusesList, 8); // gem multi
        const pyriteRhombolBonus = getJewelBonus(jewelsList, 9, spelunkerObolMulti); // range bonus
        const viralConnectionBonus = getLabBonus(labBonusesList, 13); // range bonus
        let labBonuses = checkConnection(labBonusesList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, equinoxConnectionRangeBonus, winnerBonus, connectedPlayers?.[i], false);
        labBonusesList = labBonuses.resArr;
        let jewels = checkConnection(jewelsList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, equinoxConnectionRangeBonus, winnerBonus, connectedPlayers?.[i], true);
        jewelsList = jewels.resArr;
        if (jewelsList?.[16]?.acquired && !jewelsList?.[16]?.active) {
          jewelsList[16].active = true;
          playersInTubes = calcPlayerLineWidth(playersInTubes, labBonusesList, jewelsList,
            playersChips, account, account?.cards, account?.gemShopPurchases, arenaWave, waveReqs, buboPlayer, charactersData, updatedCharactersData);
          jewelsList[16].active = false;
        }
        labBonuses = checkConnection(labBonusesList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, equinoxConnectionRangeBonus, winnerBonus, connectedPlayers?.[i], false);
        labBonusesList = labBonuses.resArr;
        jewels = checkConnection(jewelsList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, equinoxConnectionRangeBonus, winnerBonus, connectedPlayers?.[i], true);
        jewelsList = jewels.resArr;
        foundNewConnection = !foundNewConnection
          ? newPlayerConnection || jewels?.newConnection || labBonuses?.newConnection
          : foundNewConnection;
      }
    }
  }

  const higherEffects = getJewelBonus(jewelsList, 19);
  const spelunkerObolMulti = getLabBonus(labBonusesList, 8); // gem multi
  jewelsList = jewelsList.map((jewel, index) => ({
    ...jewel,
    multiplier: index === 19 ? 1 : spelunkerObolMulti + (jewelsList?.[19]?.active ? higherEffects : 0) / 100
  }));

  const slabHigherEffect = getJewelBonus(jewelsList, 18);
  labBonusesList = labBonusesList.map((bonus, index) => {
    if (index !== 15) return bonus;
    const updatedBonus = bonus?.bonusOn + slabHigherEffect;
    return { ...bonus, bonusOn: updatedBonus, description: bonus?.description?.replace('1.25', `1.${updatedBonus}`) }
  })

  const totalSpeciesUnlocked = account?.breeding.speciesUnlocks.reduce((sum, world) => sum + world, 0);
  const purpleNaveete = jewelsList?.[1]?.active;
  labBonusesList = applyBonusDesc(labBonusesList, totalSpeciesUnlocked * (purpleNaveete ? 1.75 : 1), 0, purpleNaveete
    ? 1.75
    : 1);

  const greenStacks = account?.storage?.list?.filter(item => item.amount >= 1e7).length;
  const bankerFuryBonusFromJewel = jewelsList?.[17]?.active ? 1.5 : 0;
  labBonusesList = applyBonusDesc(labBonusesList, greenStacks * (2 + bankerFuryBonusFromJewel), 11, 2 + bankerFuryBonusFromJewel)

  const greenMushroomKilled = Math.floor(account?.deathNote?.[0]?.mobs?.[0].kills / 1e6);
  const fungyFingerBonusFromJewel = labBonusesList?.[13]?.active ? greenMushroomKilled * 1.6 : 0;
  const fungyFingerBonus = greenMushroomKilled * labBonusesList?.[9]?.bonusOn;
  labBonusesList = applyBonusDesc(labBonusesList, fungyFingerBonus + fungyFingerBonusFromJewel, 9);

  playersCords = playersCords?.map((player, index) => {
    const p = playersInTubes?.find(({ playerId }) => playerId === index);
    return {
      ...player,
      lineWidth: p?.lineWidth || player?.lineWidth || 0,
      soupedUp: index < soupedUpSlots
    }
  })
  return {
    playersCords,
    playersChips: playersChips ?? [],
    connectedPlayers,
    jewels: jewelsList,
    chips: chipList,
    labBonuses: labBonusesList,
    totalRawChips: chipRepo.reduce((res, amount) => res + Math.max(0, amount), 0),
    currentRotation
  };
}

export const isLabEnabledBySorcererRaw = (charData, godIndex) => {
  if (classes?.[charData?.CharacterClass] === CLASSES.Elemental_Sorcerer) {
    const polytheism = charData?.SkillLevels?.[505];
    return polytheism % 10 === godIndex;
  }
}

export const isGodEnabledBySorcerer = (character, godIndex) => {
  if (checkCharClass(character?.class, CLASSES.Elemental_Sorcerer)) {
    const polytheism = character.flatTalents?.find(({ talentId }) => talentId === 505);
    return polytheism?.level % 10 === godIndex;
  }
}

export const applyBonusDesc = (labBonusesList, bonusDesc, index, extraData = '') => {
  return labBonusesList?.map((bonus, ind) => ind === index ? {
    ...bonus,
    bonusOn: bonusDesc,
    extraData,
    bonusDesc
  } : bonus);
}

export const getJewelBonus = (jewels, index, multiplier = 1) => {
  const jewel = jewels?.find(jewel => jewel.index === index) || {};
  return jewel?.active ? jewel?.bonus * (jewel?.multiplier || multiplier) : 0;
}

export const getLabBonus = (labBonuses, index) => {
  const bonus = labBonuses?.find(bonus => bonus.index === index) || {};
  return (bonus?.active ? bonus?.bonusOn : bonus?.bonusOff) ?? 0;
}

const getDistance = (x1, y1, x2, y2) => {
  return .9604339 * Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2)) + .397824735 * Math.min(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

const getRange = (connectionBonus, viralRangeBonus, taskConnectionRange, equinoxConnectionRangeBonus, winnerBonus, index, isJewel) => {
  if ((!isJewel && (index === 13 || index === 8)) || ((index === 9 && isJewel) || (index === 19 && isJewel))) {
    return 80;
  }
  if (isJewel && (index === 21 || index === 22 || index === 23)) {
    return 100;
  }
  return (80 * (1 + (connectionBonus + viralRangeBonus) / 100)) + taskConnectionRange + equinoxConnectionRangeBonus + winnerBonus;
}

export const calcPlayerLineWidth = (playersInTubes, labBonuses, jewels, chips, account, cards, gemShopPurchases, arenaWave, waveReqs, buboPlayer, charactersData, updatedCharactersData) => {
  return playersInTubes?.map((character) => {
    const soupedTubes = (gemShopPurchases?.find((value, index) => index === 123) ?? 0) * 2;
    const petArenaBonus = isArenaBonusActive(arenaWave, waveReqs, 13) ? 20 : 0;
    const realIndex = charactersData?.find(({ name }) => name === character?.name)?.playerId;
    const lineWidth = getPlayerLineWidth(character,
      character?.Lv0?.[12], // lab skill
      soupedTubes > 0 && (realIndex <= soupedTubes),
      labBonuses,
      jewels,
      chips?.[character?.playerId],
      account,
      cards,
      petArenaBonus,
      buboPlayer,
      updatedCharactersData
    );
    return { ...character, lineWidth };
  })
}

export const getPlayerLineWidth = (playerCords, labLevel, soupedTube, labBonuses, jewels, chips, account, cards, petArenaBonus, buboPlayer, updatedCharactersData) => {
  const spelunkerObolMulti = getLabBonus(labBonuses, 8);
  const labSkillLevel = labLevel ?? 0;
  let baseLineWidth = 50 + 2 * labSkillLevel;
  const { acquired, x, y } = jewels[5];
  if (acquired) {
    if (getDistance(x, y, playerCords.x, playerCords.y) < 150) {
      baseLineWidth *= 1.25;
    }
  }
  const bonusLineWidth = soupedTube ? 30 : 0;
  const conductiveMotherboardBonus = chips?.reduce((res, chip) => chip.index === 6 ? res + chip.baseVal : res, 0);
  const blackDiamondRhinstone = getJewelBonus(jewels, 16, spelunkerObolMulti);
  const mealPxBonus = getMealsBonusByEffectOrStat(account, null, 'PxLine', blackDiamondRhinstone);
  const mealLinePctBonus = getMealsBonusByEffectOrStat(account, null, 'LinePct', blackDiamondRhinstone);
  const lineWidthCards = getCardBonusByEffect(cards, 'Line_Width_(Passive)');
  // Line Width in Lab
  const shinyLabBonus = getShinyBonus(account?.breeding?.pets, 'Line_Width_in_Lab');

  let purpleTubeBonus = 0;
  if (playerCords?.x >= buboPlayer?.x) {
    const purpleTubeLevel = buboPlayer.SkillLevels[536] || 0;
    const purpleTubeData = talents?.[CLASSES.Bubonic_Conjuror]?.['PURPLE_TUBE'] || {};
    if (updatedCharactersData) {
      purpleTubeBonus = getHighestTalentByClass(updatedCharactersData, CLASSES.Bubonic_Conjuror, 'PURPLE_TUBE', false, true)
    }
    else {
      purpleTubeBonus = growth(purpleTubeData?.funcX, purpleTubeLevel, purpleTubeData?.x1, purpleTubeData?.x2, false) ?? 0;
    }
  }
  return Math.floor((baseLineWidth + mealPxBonus + Math.min(lineWidthCards, 50)) *
    (1 + ((purpleTubeBonus + mealLinePctBonus) + ((conductiveMotherboardBonus) + (20 * petArenaBonus) + shinyLabBonus + bonusLineWidth)) / 100));
}

const getPrismPlayerConnection = (playersInTubes) => {
  for (let i = 0; i < playersInTubes.length; i++) {
    const { x, y, lineWidth } = playersInTubes[i];
    const dist = getDistance(43, 229, x, y);
    if (dist < lineWidth) {
      return playersInTubes[i];
    }
  }
  return null;
}

const checkPlayerConnection = (playersInTubes, connectedPlayers, playerCords) => {
  for (let i = 0; i < playersInTubes.length; i++) {
    const { x, y, lineWidth } = playersInTubes[i];
    const inRange = getDistance(playerCords.x, playerCords.y, x, y) < lineWidth;
    if (!connectedPlayers.find((player) => player.playerId === playersInTubes[i].playerId) && inRange) {
      return playersInTubes[i];
    }
  }
  return null;
}

// Check connection for jewels / bonuses
const checkConnection = (array, connectionRangeBonus, viralRangeBonus, taskConnectionRange, equinoxConnectionRangeBonus, winnerBonus, playerCords, acquirable) => {
  return array?.reduce((res, object, index) => {
    let newConnection = false;
    const range = getRange(connectionRangeBonus, viralRangeBonus, taskConnectionRange, equinoxConnectionRangeBonus, winnerBonus, index, acquirable);
    const distance = getDistance(playerCords.x, playerCords.y, object.x, object.y);
    const inRange = distance < range;
    if (inRange && !object.active && (!acquirable || acquirable && object.acquired)) {
      object.active = true;
      newConnection = true;
    }
    return { resArr: [...res.resArr, object], newConnection }
  }, { resArr: [], newConnection: false });
};

export const getPlayerLabChipBonus = (character, account, chipIndex) => {
  return account?.lab?.playersChips?.[character?.playerId]?.reduce((sum, chip) => {
    return chip?.index === chipIndex ? sum + chip?.baseVal : sum;
  }, 0) ?? 0;
}

export const getRequirementAmount = (name, rawName, account) => {
  let totalAmount;
  if (rawName.includes('Spice')) {
    const spice = account?.cooking?.spices?.available?.find(({ rawName: sRawName }) => sRawName === rawName);
    totalAmount = spice?.amount || 0;
  }
  else if (rawName.includes('CookingM')) {
    const meal = account?.cooking?.meals?.find(({ name: mName }) => mName === name)
    totalAmount = meal?.amount || 0;
  }
  else {
    totalAmount = calculateItemTotalAmount(account?.storage?.list, rawName, true, true);
  }
  return totalAmount;
}

export const getLabEfficiency = (character, characters, account, playerInfo) => {
  const allEfficiencies = getAllEff(character, characters, account);
  const talentBonus = getTalentBonus(character?.flatTalents, 'SKILL_WIZ');
  const talentBonus2 = getTalentBonus(character?.flatTalents, 'UPLOAD_SQUARED');
  const talentBonus3 = getTalentBonus(character?.flatTalents, 'SMART_EFFICIENCY');
  const equipBonus = getStatsFromGear(character, 63, account);
  const equipBonus2 = getStatsFromGear(character, 66, account);
  const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.laboratory?.rank, 0);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Science_Spare_Parts', 0);
  const allBaseSkillEff = getAllBaseSkillEff(character, account, characters, playerInfo);

  return allEfficiencies
  * (200 + (Math.pow(character?.stats?.wisdom, 0.6)
    * (1 + talentBonus / 100)
    + (equipBonus
      + (allBaseSkillEff
        + postOfficeBonus))))
  * (1 + (talentBonus2
    + (equipBonus2
      + 10 * masteryBonus)) / 100)
  * (1 + talentBonus3 / 100)

}