import { growth, tryToParse } from "../utility/helpers";
import { chips, classes, jewels, labBonuses, randomList, talents, tasks } from "../data/website-data";
import { getMealsBonusByEffectOrStat } from "./cooking";
import { getCardBonusByEffect } from "./cards";
import { isArenaBonusActive, isCompanionBonusActive } from './misc';
import { getShinyBonus } from "./breeding";

export const getLab = (idleonData, charactersData, account) => {
  const labRaw = tryToParse(idleonData?.Lab) || idleonData?.Lab;
  return parseLab(labRaw, charactersData, account);
}

const parseLab = (labRaw, charactersData, account) => {
  if (!labRaw) return {}
  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const [cords] = labRaw;
  const [chipRepo] = labRaw?.splice(15);
  const [jewelsRaw] = labRaw?.splice(14);
  const playerChipsRaw = labRaw?.slice(1, charactersData?.length + 1);
  let playerCordsChunk = 2, playersCords = [];
  for (let i = 0; i < cords.length; i += playerCordsChunk) {
    const [x, y] = cords.slice(i, i + playerCordsChunk);
    playersCords = [...playersCords, {
      x,
      y,
      playerId: i / 2,
      playerName: charactersData?.[i / 2]?.name,
      class: classes[charactersData?.[i / 2]?.CharacterClass]
    }];
  }
  playersCords = playersCords?.filter((player) => player?.playerName);
  let jewelsList = jewelsRaw?.map((jewel, index) => {
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

  let playersInTubes = [...charactersData].filter((character, index) => isCompanionBonusActive(account, 0) || character?.AFKtarget === "Laboratory" ||
    isLabEnabledBySorcererRaw(character, 1) || account?.divinity?.linkedDeities?.[index] === 1)
    .map((character) => ({
      ...character,
      x: playersCords?.[character?.playerId]?.x,
      y: playersCords?.[character?.playerId]?.y,

    }));

  const chipList = JSON.parse(JSON.stringify(chips));
  chipRepo?.map((chipCount, chipIndex) => {
    if (chipIndex < chips.length) {
      const playerUsedCount = playersChips.flatMap(chips => chips).filter(chip => chip !== -1).reduce((sum, chip) => sum + (chip.index === chipList[chipIndex].index ? 1 : 0), 0);
      chipList[chipIndex].amount = chipCount - playerUsedCount;
    }
  });

  const calculatedTaskConnectionRange = (account?.tasks?.[2]?.[3]?.[4] ?? 0) * tasks?.[3]?.[4]?.bonusPerLevel;
  let buboPlayer = charactersData.find(({ CharacterClass }) => CharacterClass === 36);
  if (buboPlayer) {
    buboPlayer = { ...buboPlayer, ...playersCords?.[buboPlayer?.playerId] }
  }

  let foundNewConnection = true;
  let counter = 0;
  let labBonusesList = JSON.parse(JSON.stringify(labBonuses));
  let connectedPlayers = [];
  while (foundNewConnection) {
    foundNewConnection = false;
    counter += 1;
    playersInTubes = calcPlayerLineWidth(playersInTubes, labBonusesList, jewelsList,
      playersChips, account, account?.cards, account?.gemShopPurchases, arenaWave, waveReqs, buboPlayer);

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
        const spelunkerObolMulti = getLabBonus(labBonusesList, 8); // gem multi
        const pyriteRhombolBonus = getJewelBonus(jewelsList, 9, spelunkerObolMulti); // range bonus
        const viralConnectionBonus = getLabBonus(labBonusesList, 13); // range bonus
        let labBonuses = checkConnection(labBonusesList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, connectedPlayers?.[i], false);
        labBonusesList = labBonuses.resArr;
        let jewels = checkConnection(jewelsList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, connectedPlayers?.[i], true);
        jewelsList = jewels.resArr;
        if (jewelsList?.[16]?.acquired && !jewelsList?.[16]?.active) {
          jewelsList[16].active = true;
          playersInTubes = calcPlayerLineWidth(playersInTubes, labBonusesList, jewelsList,
            playersChips, account, account?.cards, account?.gemShopPurchases, arenaWave, waveReqs, buboPlayer, charactersData);
          jewelsList[16].active = false;
        }
        labBonuses = checkConnection(labBonusesList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, connectedPlayers?.[i], false);
        labBonusesList = labBonuses.resArr;
        jewels = checkConnection(jewelsList, pyriteRhombolBonus, viralConnectionBonus, calculatedTaskConnectionRange, connectedPlayers?.[i], true);
        jewelsList = jewels.resArr;
        foundNewConnection = !foundNewConnection ? newPlayerConnection || jewels?.newConnection || labBonuses?.newConnection : foundNewConnection;
      }
    }
  }

  const spelunkerObolMulti = getLabBonus(labBonusesList, 8); // gem multi
  jewelsList = jewelsList.map((jewel) => ({ ...jewel, multiplier: spelunkerObolMulti }));

  const totalSpeciesUnlocked = account?.breeding.speciesUnlocks.reduce((sum, world) => sum + world, 0);
  const purpleNaveete = jewelsList?.[1]?.active;
  labBonusesList = applyBonusDesc(labBonusesList, totalSpeciesUnlocked * (purpleNaveete ? 1.75 : 1), 0, purpleNaveete ? 1.75 : 1);

  let greenStacks = account?.storage?.filter(item => item.amount >= 1e7).length;
  const bankerFuryBonusFromJewel = jewelsList?.[17]?.active ? 1.5 : 0;
  labBonusesList = applyBonusDesc(labBonusesList, greenStacks * (2 + bankerFuryBonusFromJewel), 11, 2 + bankerFuryBonusFromJewel)

  playersCords = playersCords?.map((player, index) => {
    const p = playersInTubes?.find(({ playerId }) => playerId === index);
    return {
      ...player,
      lineWidth: p?.lineWidth || player?.lineWidth || 0
    }
  })

  return {
    playersCords,
    playersChips,
    connectedPlayers,
    jewels: jewelsList,
    chips: chipList,
    labBonuses: labBonusesList
  };
}

export const isLabEnabledBySorcererRaw = (charData, godIndex) => {
  if (classes?.[charData?.CharacterClass] === 'Elemental_Sorcerer') {
    const polytheism = charData?.SkillLevels?.[505];
    return polytheism % 10 === godIndex;
  }
}

export const isGodEnabledBySorcerer = (character, godIndex) => {
  if (character?.class === 'Elemental_Sorcerer') {
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
  return bonus?.active ? bonus?.bonusOn : bonus?.bonusOff;
}

const getDistance = (x1, y1, x2, y2) => {
  return 0.9604339 * Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2)) + 0.397824735 * Math.min(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

const getRange = (connectionBonus, viralRangeBonus, taskConnectionRange, index, isJewel) => {
  if ((!isJewel && (index === 13 || index === 8)) || (index === 9 && isJewel)) {
    return 80;
  }
  return (80 * (1 + (connectionBonus + viralRangeBonus) / 100)) + taskConnectionRange;
}

export const calcPlayerLineWidth = (playersInTubes, labBonuses, jewels, chips, account, cards, gemShopPurchases, arenaWave, waveReqs, buboPlayer, charactersData) => {
  return playersInTubes?.map((character) => {
    const soupedTubes = (gemShopPurchases?.find((value, index) => index === 123) ?? 0) * 2;
    const petArenaBonus = isArenaBonusActive(arenaWave, waveReqs, 13) ? 20 : 0;
    const realIndex = charactersData?.find(({ name }) => name === character?.name)?.playerId;
    const lineWidth = getPlayerLineWidth(character,
      character?.Lv0?.[12], // lab skill
      realIndex < soupedTubes,
      labBonuses,
      jewels,
      chips?.[character?.playerId],
      account,
      cards,
      petArenaBonus,
      buboPlayer
    );
    return {
      ...character,
      lineWidth
    };
  })
}

export const getPlayerLineWidth = (playerCords, labLevel, soupedTube, labBonuses, jewels, chips, account, cards, petArenaBonus, buboPlayer) => {
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
    const purpleTubeData = talents?.['Bubonic_Conjuror']?.['PURPLE_TUBE'] || {};
    purpleTubeBonus = growth(purpleTubeData?.funcX, purpleTubeLevel, purpleTubeData?.x1, purpleTubeData?.x2, false) ?? 0;
  }

  // No Chips
  // const noChips = Math.floor(((baseLineWidth) + (mealPxBonus + Math.min(lineWidthCards, 50))) * (1 + (purpleTubeBonus + mealLinePctBonus + (20 * petArenaBonus + bonusLineWidth)) / 100))

  // HAS CHIPS
  // const hasChips = Math.floor(baseLineWidth * (1 + ((purpleTubeBonus + mealLinePctBonus) + (conductiveMotherboardBonus + (20 * petArenaBonus + bonusLineWidth))) / 100))
  return Math.floor((baseLineWidth + mealPxBonus + Math.min(lineWidthCards, 50)) *
    (1 + ((purpleTubeBonus + mealLinePctBonus) + ((conductiveMotherboardBonus) + (20 * petArenaBonus) + shinyLabBonus + bonusLineWidth)) / 100))
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
const checkConnection = (array, connectionRangeBonus, viralRangeBonus, taskConnectionRange, playerCords, acquirable) => {
  return array?.reduce((res, object, index) => {
    let newConnection = false;
    const range = getRange(connectionRangeBonus, viralRangeBonus, taskConnectionRange, index, acquirable);
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
  }, 0)
}

