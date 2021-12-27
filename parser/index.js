import {
  anvilProductionItems,
  bubblesMap,
  calculateCardSetStars,
  calculateDeathNote,
  calculateItemTotalAmount,
  calculateLeaderboard,
  calculateWeirdObolIndex,
  cardSetMap,
  createItemsWithUpgrades,
  createTalentPage,
  getInventory,
  keysMap,
  mapAccountQuests,
  prayersMap,
  shopMapping,
  skillIndexMap,
  starSignsIndicesMap,
  talentPagesMap
} from "./parserUtils";
import {
  achievements,
  bribes,
  carryBags,
  cauldrons,
  classes,
  constellations,
  mapNames,
  mapPortals,
  monsters,
  postOffice,
  randomList,
  refinery,
  saltLicks,
  shops,
  shrines,
  starSignByIndexMap,
  starSigns,
  vials
} from "../data/website-data";

const { cards, items, obols, stamps, statues } = require("../data/website-data");
const { calculateStars, createObolsWithUpgrades, filteredLootyItems } = require("./parserUtils");

const parseIdleonData = (idleonData) => {
  try {
    const characterNames = Object.entries(idleonData?.PlayerDATABASE);
    let characters = characterNames.map(([charName, charData], index) => ({
      name: charName,
      ...(Object.entries(charData)?.reduce((res, [key, value]) => ({ ...res, [`${key}_${index}`]: value }), {}))
    }));
    let account = createAccountData(idleonData, characters);
    let charactersData = createCharactersData(idleonData, characters, account);
    let skills = charactersData?.map(({ name, skillsInfo }) => ({ name, skillsInfo }));
    let leaderboard = calculateLeaderboard(skills);
    charactersData = charactersData.map((character) => ({ ...character, skillsInfo: leaderboard[character?.name] }));

    const quests = mapAccountQuests(charactersData);
    charactersData = charactersData.map(({ quests, ...rest }) => rest);
    const deathNote = calculateDeathNote(charactersData);
    account = { ...account, quests, deathNote };
    return { account, characters: charactersData }
  } catch (err) {
    console.error('An error has occurred while parsing idleon data', err);
    return {};
  }
}

const createAccountData = (idleonData, characters) => {
  let account = {};
  const cardsObject = idleonData?.Cards?.[0];

  account.cards = Object.keys(cardsObject)?.reduce(
    (res, card) => {
      const cardDetails = cards?.[card];
      if (!cardDetails) return res;
      return {
        ...res,
        [cardDetails?.displayName]: {
          ...cardDetails,
          amount: cardsObject?.[card],
          stars: calculateStars(cardDetails?.perTier, cardsObject?.[card]),
        }
      }
    }, {});

  const obolsMapping = idleonData?.ObolEquippedOrder?.[1]?.map((obol, index) => ({
    displayName: items?.[obol],
    rawName: obol,
    ...(obols?.family[index] ? obols?.family[index] : {})
  }));

  account.obols = createObolsWithUpgrades(obolsMapping, idleonData?.ObolEquippedMap?.[1]);

  const lootyObject = idleonData?.Cards?.[1];
  const allItems = JSON.parse(JSON.stringify(items)); // Deep clone
  lootyObject.forEach((lootyItemName) => {
    if (allItems?.[lootyItemName]?.displayName) {
      delete allItems?.[lootyItemName];
    }
  });

  account.missingLootyItems = Object.keys(allItems).reduce((res, key) => (!filteredLootyItems[key] ? [
    ...res,
    {
      name: allItems?.[key]?.displayName,
      rawName: key,
    }] : res), []);

  const stampsMapping = { 0: "combat", 1: "skills", 2: "misc" };
  const stampsObject = idleonData?.StampLevel?.reduce((result, item, index) => ({
    ...result,
    [stampsMapping?.[index]]: Object.keys(item).reduce((res, key) => (key !== 'length' ? [
        ...res,
        { level: parseFloat(item[key]) }
      ]
      : res), []),
  }), {});

  account.stamps = {
    combat: stampsObject.combat.map((item, index) => ({ ...stamps['combat'][index], ...item })),
    skills: stampsObject.skills.map((item, index) => ({ ...stamps['skills'][index], ...item })),
    misc: stampsObject.misc.map((item, index) => ({ ...stamps['misc'][index], ...item })),
  };


  const goldStatuesObject = idleonData?.StatueG || [];
  const goldStatues = goldStatuesObject.reduce((res, item, index) => (item === 1 ? {
    ...res,
    [index]: true
  } : res), {});
  //
  const firstCharacterStatues = characters?.[0]?.['StatueLevels_0'];
  account.statues = Object.keys(goldStatues).map((statueIndex) => ({
    rawName: `StatueG${parseInt(statueIndex) + 1}`,
    level: firstCharacterStatues[statueIndex][0],
    ...(statues?.[statueIndex] || {})
  }));

  const moneyArr = ['MoneyBANK', Array(characters?.length).fill(0).map((_, index) => `Money_${index}`)];
  const money = moneyArr.reduce((res, moneyInd) =>
    (res + (idleonData?.[moneyInd] ? parseInt(idleonData?.[moneyInd]) : 0)), 0);
  account.money = String(money).split(/(?=(?:..)*$)/);

  const inventoryArr = idleonData?.ChestOrder;
  const inventoryQuantityArr = idleonData?.ChestQuantity;
  account.inventory = getInventory(inventoryArr, inventoryQuantityArr, 'storage');


  const shrinesArray = idleonData?.ShrineInfo;
  const startingIndex = 18;
  account.shrines = shrinesArray.reduce((res, item, localIndex) => {
    const index = startingIndex + localIndex;
    const [shrineId, , , shrineLevel] = item;
    const { shrineName, desc, baseBonus, bonusPerLevel } = shrines[index];
    return shrineId !== 0 && shrineName !== 'Unknown' ? [...res, {
      shrineLevel,
      name: shrineName,
      rawName: `ConTowerB${index}`,
      bonus: baseBonus + (shrineLevel - 1) * bonusPerLevel,
      desc
    }] : res;
  }, []);

  const colosseumIndexMapping = { 1: true, 2: true, 3: true };
  const colosseumHighscoresArray = idleonData?.FamilyValuesMap?.ColosseumHighscores;
  account.colosseumHighscores = colosseumHighscoresArray
    .filter((_, index) => colosseumIndexMapping[index])
    .map((score) => parseInt(score));

  const minigameIndexMapping = { 0: 'chopping', 1: 'fishing', 2: 'catching', 3: 'mining' };
  const minigameHighscoresArray = idleonData?.FamilyValuesMap?.MinigameHiscores;
  account.minigameHighscores = minigameHighscoresArray
    .filter((_, index) => minigameIndexMapping[index])
    .map((score, index) => ({ minigame: minigameIndexMapping[index], score }));

  const shopStockArray = idleonData?.['ShopStock'];
  account.shopStock = shopStockArray?.reduce((res, shopObject, shopIndex) => {
    const realShopStock = shopObject;
    // delete realShopStock.length;
    const shopName = shopMapping?.[shopIndex]?.name;
    const mapped = Object.values(realShopStock)?.reduce((res, item, itemIndex) => {
      const isIncluded = shopMapping?.[shopIndex]?.included?.[itemIndex];
      const amount = parseInt(item) || 0;
      return amount > 0 && isIncluded ? [...res, { amount: item, ...shops[shopName][itemIndex] }] : res;
    }, [])
    return [...res, mapped]
  }, []);

  // 0-3 cauldrons
  // 4 - vials
  account.alchemy = {};
  const cauldronsIndexMapping = { 0: "power", 1: "quicc", 2: "high-iq", 3: 'kazam' };
  const cauldronsTextMapping = { 0: "O", 1: "G", 2: "P", 3: 'Y' };
  const cauldronsInfoArray = idleonData?.CauldronInfo;
  account.alchemy.bubbles = cauldronsInfoArray?.reduce((res, array, index) => (index <= 3 ? {
    ...res,
    [cauldronsIndexMapping?.[index]]: Object.keys(array)?.reduce((res, key, bubbleIndex) => (
      key !== 'length' ? [
        ...res,
        {
          level: parseInt(array?.[key]) || 0,
          rawName: `aUpgrades${cauldronsTextMapping[index]}${bubbleIndex}`,
          ...cauldrons[cauldronsIndexMapping?.[index]][key],
        }] : res), [])
  } : res), {});


  const vialsObject = idleonData?.CauldronInfo?.[4];
  account.alchemy.vials = Object.keys(vialsObject).reduce((res, key, index) => {
    const vial = vials?.[index];
    return key !== 'length' ? [...res, {
      level: parseInt(vialsObject?.[key]) || 0,
      ...vial
    }] : res;
  }, []);

  // first 16 elements belong to cauldrons' levels
  // 4 * 4
  const rawCauldronsLevelsArray = idleonData?.CauldronInfo?.[8]?.reduce((res, array) => [...res, ...array], []);
  const cauldronsLevels = rawCauldronsLevelsArray.slice(0, 16);
  const cauldronsLevelsMapping = { 0: "power", 4: "quicc", 8: "high-iq", 12: 'kazam' };
  let cauldronsObject = {};
  const chunk = 4;
  for (let i = 0, j = cauldronsLevels.length; i < j; i += chunk) {
    const [speed, luck, cost, extra] = cauldronsLevels.slice(i, i + chunk);
    cauldronsObject[cauldronsLevelsMapping[i]] = {
      speed: parseInt(speed) || 0,
      luck: parseInt(luck) || 0,
      cost: parseInt(cost) || 0,
      extra: parseInt(extra) || 0
    };
  }
  account.alchemy.cauldrons = cauldronsObject;

  const bribesArray = idleonData?.BribeStatus;
  account.bribes = bribesArray?.reduce((res, bribeStatus, index) => {
    return bribeStatus !== -1 ? [...res, {
      done: bribeStatus === 1,
      ...(bribes?.[index] || [])
    }] : res;
  }, []);

  const constellationsArray = idleonData?.StarSignProg;
  account.constellations = constellationsArray?.reduce((res, constellation, index) => {
    const constellationInfo = constellations[index];
    const [completedChars, done] = constellation;
    const mapIndex = constellationInfo?.mapIndex;
    return mapIndex !== null ? [...res, {
      ...constellationInfo,
      location: mapNames[mapIndex],
      completedChars,
      done: !!done
    }] : res;
  }, []);

  const starSignsObject = idleonData?.StarSignsUnlocked;
  const starSignsMapping = starSigns?.map((starSign) => {
    const { starName } = starSign;
    return {
      ...starSign,
      starName: `${starSignsIndicesMap?.[starName]} - ${starName}`,
      unlocked: !!starSignsObject?.[starName]
    }
  }, []);
  const sortAlphaNum = (a, b) => a.starName.localeCompare(b.starName, 'en', { numeric: true });
  const sortedSigns = starSignsMapping.sort(sortAlphaNum);
  const lastItem = sortedSigns.pop();
  sortedSigns.splice(21, 0, lastItem);

  account.starSigns = sortedSigns;

  // Achievements
  const achievementsRegistry = idleonData?.AchieveReg;
  const steamAchievements = idleonData?.SteamAchieve;
  account.achievements = achievements.map((achievement, index) => {
    const { steamIndex } = achievement;
    const completed = steamIndex ? steamAchievements?.[steamIndex] === -1 : achievementsRegistry?.[index] === -1;
    const currentQuantity = steamIndex ? steamAchievements?.[steamIndex] : achievementsRegistry?.[index];
    return { ...achievement, completed, ...(currentQuantity >= 0 ? { currentQuantity } : {}) }
  });

  // Refinery
  // 1 - inventory, 3 - redox salt
  // [refined, rank, unknown, on/off, auto-refined %]
  const refineryObject = idleonData?.Refinery;
  const refineryStorage = idleonData?.Refinery?.[1]?.reduce((res, saltName, index) => saltName !== 'Blank' ? [...res, {
    rawName: saltName,
    name: items[saltName]?.displayName,
    amount: idleonData?.Refinery?.[2]?.[index]
  }] : res, []);
  const powerCap = randomList[18]?.split(' ');
  const refinerySaltTaskLevel = idleonData?.Tasks?.[2]?.[2]?.[6];
  const salts = refineryObject?.slice(3, 3 + idleonData?.Refinery?.[0]?.[0]);
  const saltsArray = salts?.reduce((res, salt, index) => {
    const name = `Refinery${index + 1}`
    const [refined, rank, , active, autoRefinePercentage] = salt;
    const { saltName, cost } = refinery?.[name];
    const componentsWithTotalAmount = cost?.map((item) => {
      let amount = calculateItemTotalAmount(account?.inventory, item?.name, true);
      if (item?.rawName?.includes('Refinery')) {
        amount += calculateItemTotalAmount(refineryStorage, 'Refinery', false);
      }
      return {
        ...item,
        totalAmount: amount
      }
    })
    return [
      ...res,
      {
        saltName,
        cost: componentsWithTotalAmount,
        rawName: name,
        powerCap: parseFloat(powerCap?.[rank]),
        refined,
        rank,
        active,
        autoRefinePercentage
      }
    ];
  }, []);

  account.refinery = {
    salts: saltsArray,
    refinerySaltTaskLevel
  }

  account.bundles = Object.entries(idleonData?.BundlesReceived).reduce((res, [bundleName, owned]) => owned ? [...res, {
    name: bundleName,
    owned: !!owned
  }] : res, []).sort((a, b) => a?.name?.match(/_[a-z]/i)?.[0].localeCompare(b?.name?.match(/_[a-z]/i)?.[0]))

  account.saltLicks = idleonData?.SaltLick?.map((level, index) => {
    const bonus = saltLicks[index];
    const totalAmount = calculateItemTotalAmount([...account?.inventory, ...refineryStorage], bonus?.name, true);
    return {
      ...bonus,
      totalAmount,
      level
    }
  }).filter(({ level }) => level > 0);

  account.worldTeleports = idleonData?.CurrenciesOwned['WorldTeleports'];
  account.keys = idleonData?.CurrenciesOwned['KeysAll'].reduce((res, keyAmount, index) => keyAmount > 0 ? [...res, { amount: keyAmount, ...keysMap[index] }] : res, []);
  account.colosseumTickets = idleonData?.CurrenciesOwned['ColosseumTickets'];
  account.obolFragments = idleonData?.CurrenciesOwned['ObolFragments'];
  account.silverPens = idleonData?.CurrenciesOwned['SilverPens'];
  account.goldPens = idleonData?.CurrenciesOwned['GoldPens'];
  account.gems = idleonData?.['GemsOwned'];
  account.deliveryBoxComplete = idleonData?.CurrenciesOwned['DeliveryBoxComplete'];
  account.deliveryBoxStreak = idleonData?.CurrenciesOwned['DeliveryBoxStreak'];
  account.deliveryBoxMisc = idleonData?.CurrenciesOwned['DeliveryBoxMisc'];

  return account;
}

const createCharactersData = (idleonData, characters, account) => {
  return characters?.map((char, charIndex) => {
    const character = {};
    const personalValuesMap = char?.[`PersonalValuesMap_${charIndex}`];
    character.name = char?.name;
    character.class = classes?.[char?.[`CharacterClass_${charIndex}`]];
    character.afkTime = parseFloat(char?.[`PlayerAwayTime_${charIndex}`]);
    character.afkTarget = monsters?.[char?.[`AFKtarget_${charIndex}`]]?.Name;
    character.currentMap = mapNames?.[char?.[`CurrentMap_${charIndex}`]];
    const statMap = { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' };
    character.stats = personalValuesMap?.StatList?.reduce((res, statValue, index) => ({
      ...res,
      [statMap[index]]: statValue
    }), {});
    character.level = character.stats.level;


    // inventory bags used
    const rawInvBagsUsed = char?.[`InvBagsUsed_${charIndex}`]
    const bags = Object.keys(rawInvBagsUsed);
    character.invBagsUsed = bags?.map((bag) => ({
      id: bag,
      name: items[`InvBag${parseInt(bag) < 100 ? parseInt(bag) + 1 : bag}`]?.displayName,
      rawName: `InvBag${parseInt(bag) < 100 ? parseInt(bag) + 1 : bag}`
    })).filter(bag => bag.name);
    const carryCapacityObject = char?.[`MaxCarryCap_${charIndex}`];
    character.carryCapBags = Object.keys(carryCapacityObject).map((bagName) => (carryBags?.[bagName]?.[carryCapacityObject[bagName]])).filter(bag => bag)


    // equipment indices (0 = armor, 1 = tools, 2 = food)
    const equipmentMapping = { 0: "armor", 1: "tools", 2: "food" };
    const equippableNames = char?.[
      `EquipmentOrder_${charIndex}`
      ]?.reduce(
      (result, item, index) => ({
        ...result,
        [equipmentMapping?.[index]]: item,
      }), {});
    const equipapbleAmount = char[`EquipmentQuantity_${charIndex}`]?.reduce((result, item, index) => ({
      ...result,
      [equipmentMapping?.[index]]: item,
    }), {});

    const equipmentStoneData = char[`EquipmentMap_${charIndex}`]?.[0];
    character.equipment = createItemsWithUpgrades(equippableNames.armor, equipmentStoneData);
    const toolsStoneData = char[`EquipmentMap_${charIndex}`]?.[1];
    character.tools = createItemsWithUpgrades(equippableNames.tools, toolsStoneData);
    character.food = Array.from(Object.values(equippableNames.food)).reduce((res, item, index) =>
      item
        ? [...res, {
          name: items?.[item]?.displayName,
          rawName: item,
          amount: parseInt(equipapbleAmount.food[index] || equipapbleAmount.food[index]),
        }] : res, []);


    const inventoryArr = char[`InventoryOrder_${charIndex}`];
    const inventoryQuantityArr = char[`ItemQuantity_${charIndex}`];
    character.inventory = getInventory(inventoryArr, inventoryQuantityArr, character.name);


    // star signs
    const starSignsObject = personalValuesMap?.StarSign;
    character.starSigns = starSignsObject
      .split(",")
      .map((starSign) => starSignByIndexMap?.[starSign])
      .filter(item => item);

    // equipped bubbles
    const cauldronBubbles = idleonData?.CauldronBubbles;
    character.equippedBubbles = cauldronBubbles?.[charIndex].reduce(
      (res, bubbleInd) => (bubbleInd ? [...res, bubblesMap?.[bubbleInd]] : res), []);

    // crafting material in production
    const anvilCraftsMapping = char?.[`AnvilPAselect_${charIndex}`];
    const selectedProducts = anvilCraftsMapping
      .sort((a, b) => a - b)
      .map((item) => anvilProductionItems[item]);

    character.anvil = {
      selected: selectedProducts,
    };

    const levelsRaw = char?.[`Exp0_${charIndex}`];
    const levelsReqRaw = char?.[`ExpReq0_${charIndex}`];
    const skillsInfoObject = char?.[`Lv0_${charIndex}`];

    character.skillsInfo = skillsInfoObject.reduce(
      (res, level, index) =>
        level !== "-1" && level !== -1 ? {
          ...res,
          [skillIndexMap[index]]: { level, exp: parseFloat(levelsRaw[index]), expReq: parseFloat(levelsReqRaw[index]) },
        } : res, {});


    const cardSet = char?.[`CSetEq_${charIndex}`];
    const equippedCards = char?.[`CardEquip_${charIndex}`]
      .map((card) => ({
        cardName: cards?.[card]?.displayName,
        stars: account?.cards?.[cards?.[card]?.displayName]?.stars,
        ...cards?.[card]
      }))
      .filter((_, ind) => ind < 8); //cardEquipMap
    const cardsSetObject = cardSetMap[Object.keys(cardSet)?.[0]] || {};
    character.cards = {
      cardSet: {
        ...cardsSetObject,
        stars: calculateCardSetStars(cardsSetObject, Object.values(cardSet)?.[0])
      },
      equippedCards,
    };

    // printer
    const fieldsPrint = idleonData?.Printer;
    const printData = fieldsPrint.slice(5, fieldsPrint.length); // REMOVE 5 '0' ELEMENTS
    // There are 14 items per character
    // Every 2 items represent an item and it's value in the printer.
    // The first 5 pairs represent the stored samples in the printer.
    // The last 2 pairs represent the samples in production.
    const chunk = 14;
    const relevantPrinterData = printData.slice(
      charIndex * chunk,
      charIndex * chunk + chunk
    );
    character.printer = relevantPrinterData.reduce(
      (result, printItem, sampleIndex, array) => {
        if (sampleIndex % 2 === 0) {
          const sample = array
            .slice(sampleIndex, sampleIndex + 2)
            .map((item, sampleIndex) => sampleIndex === 0 ? items?.[item]?.displayName : item);
          if (sampleIndex < 10) {
            result.stored.push({ item: sample[0], value: sample[1] });
          } else {
            result.selected.push({ item: sample[0], value: sample[1] });
          }
        }
        return result;
      },
      { stored: [], selected: [] }
    );


    const obolObject = char?.[`ObolEquippedOrder_${charIndex}`];
    const obolsMap = obolObject.map((obol, index) => ({
      index: calculateWeirdObolIndex(index),
      displayName: items?.[obol]?.displayName,
      rawName: obol,
      ...(obols?.character[index] ? obols?.character[index] : {})
    }));
    const obolUpgradesObject = char?.[`ObolEquippedMap_${charIndex}`];
    const sortedObols = obolsMap.sort((a, b) => a.index - b.index)
    character.obols = createObolsWithUpgrades(sortedObols, obolUpgradesObject);


    const talentsObject = char?.[`SkillLevels_${charIndex}`];
    const maxTalentsObject = char?.[`SkillLevelsMAX_${charIndex}`];
    const pages = talentPagesMap?.[character?.class];
    character.talents = createTalentPage(character?.class, pages, talentsObject, maxTalentsObject);
    character.starTalents = createTalentPage(character?.class, ["Special Talent 1", "Special Talent 2"], talentsObject, maxTalentsObject, true);

    const prayersArray = char?.[`Prayers_${charIndex}`];
    character.prayers = prayersArray.reduce((res, prayerIndex) => (prayerIndex >= 0 ? [...res, { ...prayersMap?.[prayerIndex] }] : res), []);
    // 0 - current worship charge rate
    const playerStuffArray = char?.[`PlayerStuff_${charIndex}`];

    character.worshipCharge = Math.round(playerStuffArray?.[0]);

    // 3 - critter name
    const trapsArray = char[`PldTraps_${charIndex}`];
    character.traps = trapsArray?.reduce((res, critterInfo) => {
      const [critterId, , timeElapsed, critterName, , , trapTime] = critterInfo;
      if (critterId === -1 && critterId === '-1') return res;
      const timeLeft = trapTime - timeElapsed;
      const hours = parseInt(timeLeft / 3600);
      const minutes = parseInt(timeLeft % 60);
      return critterName ? [...res, {
        name: items[critterName]?.displayName,
        rawName: critterName,
        timeLeft: `${hours}h${minutes > 0 ? minutes + 'm' : ''}`
      }] : res;
    }, []);

    const quests = char?.[`QuestComplete_${charIndex}`];
    character.quests = Object.keys(quests).reduce((res, key) => {
      let [npcName, questIndex] = key.split(/([0-9]+)/);
      if (key.includes('Fishpaste')) {
        npcName = 'Fishpaste97';
      }
      return { ...res, [npcName]: { ...(res?.[npcName] || {}), [questIndex]: quests[key] } }
    }, {});

    const postOfficeObject = char?.[`PostOfficeInfo_${charIndex}`];
    let totalPointsSpent = 0;
    const boxes = postOffice?.map((box, index) => {
      const points = postOfficeObject?.[index]?.[0];
      totalPointsSpent += points;
      return { ...box, level: points || 0 }
    });

    character.postOffice = {
      boxes,
      unspentPoints: (account?.deliveryBoxComplete + account?.deliveryBoxStreak + account?.deliveryBoxMisc - totalPointsSpent) || 0
    }

    const kills = char?.[`KillsLeft2Advance_${charIndex}`];
    character.kills = kills?.reduce((res, map, index) => [...res, parseFloat(mapPortals?.[index]?.[0]) - parseFloat(map?.[0])], []);

    character.cooldowns = char?.[`AttackCooldowns_${charIndex}`];
    return character;
  });
}

export default parseIdleonData;