import { commaNotation, lavaLog, notateNumber, tryToParse } from '@utility/helpers';
import {
  abominations,
  compass,
  mapDetails,
  mapEnemiesArray,
  mapNames,
  mapPortals,
  monsters,
  randomList
} from '../data/website-data';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { getTalentBonus } from '@parsers/talents';
import { getStatsFromGear } from '@parsers/items';

const weaknesses = {
  0: 'Fire',
  1: 'Wind',
  2: 'Grass',
  3: 'Ice'
}

export const getCompass = (idleonData, charactersData, accountData, serverVars) => {
  const compassRaw = tryToParse(idleonData?.Compass);
  return parseCompass(compassRaw, charactersData, accountData, serverVars);
};

const parseCompass = (compassRaw, charactersData, accountData, serverVars) => {
  const [upgradesLevels, abominationsRaw, portalsRaw, medallionsRaw, exaltedStampsRaw] = compassRaw || [];

  const totalUpgradeLevels = upgradesLevels?.reduce((sum, level) => sum + level, 0);
  const dusts = accountData?.accountOptions?.slice(357, 362);
  const totalDustsCollected = accountData?.accountOptions?.[362];

  const unlockedPortals = (portalsRaw || []).reduce((result, mapRaw) => {
    return {
      ...result,
      [mapRaw]: true
    }
  }, {});

  const maps = getFilteredPortals()?.map(({ mapIndex, mapName }, index) => {
    const availablePortals = mapPortals?.[mapIndex];
    const portals = availablePortals.map((_, portalIndex) => {
      const costQuantity = getPortalCostQuantity(mapIndex, portalIndex);
      const costType = getPortalCostType(mapIndex);
      return {
        costQuantity,
        costType,
        unlocked: unlockedPortals?.[mapIndex + '_' + portalIndex]
      }
    });

    const monsterRawName = mapEnemiesArray?.[mapIndex];
    return {
      mapIndex,
      mapName,
      portals,
      monster: monsters?.[monsterRawName],
      unlocked: portals.every(({ unlocked }) => unlocked)
    }
  })
  const medallions = getMedallions((medallionsRaw || []).toSimpleObject())
  const abominationsList = abominations.map((abomination, index) => {
    const unlocked = abominationsRaw?.[index]
    return {
      ...abomination,
      unlocked,
      hp: (400 + (123 + 2 * Math.pow(index, 3.5) + 50 * Math.pow(index, 2)) * Math.pow(2.4, index)),
      weakness: getAbominationWeakness(abomination),
      map: mapNames?.[abomination?.x2],
      world: Math.floor((abomination?.x2 / 50) + 1)
    }
  })
  let upgrades = compass.map((upgrade, index) => {
    const level = upgradesLevels?.[index];
    const shapeIcon = 1 === upgrade?.x9 ? 'CompassCir' : level >= upgrade?.x4 ? 'CompassSqMax' : 'CompassSq';
    return {
      ...upgrade,
      level,
      shapeIcon,
      index
    }
  });
  upgrades = upgrades.map((upgrade, index) => {
    const bonus = getLocalCompassBonus(upgrades, index);
    const cost = getUpgradeCost(upgrades, index, serverVars);
    return {
      ...upgrade,
      bonus,
      cost,
      description: upgrade?.description.replace('{', commaNotation(bonus)).replace('}', notateNumber(1 + bonus / 100, 'MultiplierInfo'))
    }
  });

  const stampsMapping = {
    _: 'combat',
    a: 'skills',
    b: 'misc'
  }
  const exaltedStamps = (exaltedStampsRaw || []).reduce((result, stamp) => {
    const [, category, stampIndex] = stamp.match(/^([a-zA-Z_]+)(\d+)$/);
    const categoryName = stampsMapping?.[category];
    return {
      ...result,
      [categoryName]: {
        ...(result?.[categoryName] || {}),
        [stampIndex]: true
      }
    }
  }, { combat: {}, skills: {}, misc: {} });
  const remainingExaltedStamps = getRemainingExaltedStamps(accountData, exaltedStampsRaw?.length, 0);
  return {
    upgrades,
    groupedUpgrades: getGroupedUpgrades(upgrades),
    abominations: abominationsList,
    medallions,
    maps,
    totalAcquiredMedallions: medallionsRaw?.length,
    dusts,
    exaltedStamps,
    usedExaltedStamps: exaltedStampsRaw?.length,
    remainingExaltedStamps,
    totalUpgradeLevels,
    totalDustsCollected
  }
}

const getPortalCostQuantity = (mapIndex, portalIndex) => {
  const baseCostQuantity = (3 * (25
    + 5 * mapIndex
    + mapDetails?.[mapIndex]?.[0]?.[portalIndex ?? 0]
    * Math.pow(1.3, (mapIndex - 50 *
        Math.floor(mapIndex / 50))
      * Math.min(1, Math.floor(mapIndex / 50) + 0.2))
    * Math.pow(4, Math.floor(mapIndex / 50))))
  return 1 === mapIndex ? 50 : 2e9 > baseCostQuantity ? Math.ceil(baseCostQuantity) : 2e9;
}

const getPortalCostType = (mapIndex) => {
  return Math.min(Math.floor(mapIndex / 100) + Math.floor(mapIndex / 249), 3)
}

const getFilteredPortals = () => {
  const excludedMaps = [
    'Nothing', 'Z', 'Copper',
    'Iron', 'Starfire', 'Plat', 'Void',
    'Filler', 'JungleZ', 'Grandfrog\'s_Gazebo',
    'Grandfrog\'s_Backyard', 'Gravel_Tomb', 'Heaty_Hole',
    'Igloo\'s_Basement', 'Inside_the_Igloo', 'End_Of_The_Road',
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll',
    'Chizoar\'s_Cavern', 'KattleKruk\'s_Volcano', 'Castle_Interior'].toSimpleObject();
  return Object.entries(mapNames).map(([mapIndex, mapName], index) => {
    const rawName = mapEnemiesArray?.[index];
    const { AFKtype } = monsters?.[rawName] || {};
    return {
      mapName,
      mapIndex,
      afkType: AFKtype
    }
  }).filter(({
               mapName,
               afkType
             }) => afkType === 'FIGHTING' &&
    !excludedMaps[mapName]
    && !afkType.includes('Fish') && !afkType.includes('Bug') && !mapName.includes('Colosseum'));
}

const getMedallions = (medallions) => {
  const excludedMaps = [
    'Nothing', 'Z', 'Copper',
    'Iron', 'Starfire', 'Plat', 'Void',
    'Filler', 'JungleZ', 'Grandfrog\'s_Gazebo',
    'Grandfrog\'s_Backyard', 'Gravel_Tomb', 'Heaty_Hole',
    'Igloo\'s_Basement', 'Inside_the_Igloo', 'End_Of_The_Road',
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll',
    'Chizoar\'s_Cavern', 'KattleKruk\'s_Volcano', 'Castle_Interior'].toSimpleObject();
  const list = Object.values(mapNames).map((mapName, index) => {
    const rawName = mapEnemiesArray?.[index];
    const { MonsterFace, Name, AFKtype } = monsters?.[rawName] || {};
    return {
      mapName,
      rawName,
      monsterFace: MonsterFace,
      name: Name,
      afkType: AFKtype
    }
  }).filter(({
               mapName,
               afkType
             }) => afkType === 'FIGHTING' && !excludedMaps[mapName]
    && !afkType.includes('Bug')
    && !mapName.includes('Colosseum'));

  const config = [
    { id: 'reindeer', icon: 'afk_targets/Reindeer' },
    { id: 'caveA', icon: 'afk_targets/Demon_Hound' },
    { id: 'caveB', icon: 'afk_targets/Gloomie_Mushroom' },
    { id: 'caveC', icon: 'afk_targets/Ancient_Golem' },
    { id: 'caveD', icon: 'afk_targets/Shimmer_Glunko' },
    { id: 'rockS', icon: 'afk_targets/Skeleton_Rune', description: 'W3 Colo' },
    { id: 'Meteor', icon: 'afk_targets/Fallen_Meteor', description: 'Event Boss' },
    { id: 'rocky', icon: 'afk_targets/Grumblo', description: 'Event Boss' },
    { id: 'snakeZ', icon: 'afk_targets/Snake_Swarm', description: 'Event Boss' },
    { id: 'iceknight', icon: 'afk_targets/Glacial_Guild', description: 'Event Boss' },
    { id: 'frogGR', icon: 'afk_targets/Grandfrogger', description: 'Event Boss' },

    // Crystals
    ...[0, 1, 2, 3, 4].map(n => ({
      id: `Crystal${n}`,
      icon: `afk_targets/${monsters[`Crystal${n}`]?.Name}`
    })),

    // Bug Nests
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13].map(n => ({
      id: `BugNest${n}`,
      icon: `afk_targets/${monsters[`BugNest${n}`]?.Name}`
    })),

    // Chests
    ...[1, 2, 3, 4, 5, 6].flatMap(wave =>
      ['A', 'B', 'C'].map(type => ({
        id: `Chest${type}${wave}`,
        icon: `etc/Chest${type}`,
        description: `W ${wave}`
      }))
    )
  ];

  const extra = config.map(({ id, icon, description }) => ({
    ...monsters[id],
    rawName: id,
    icon,
    ...(description ? { description } : {})
  }));

  return [...list, ...extra].map((monster) => {
    return {
      ...monster,
      acquired: medallions?.[monster?.rawName]
    }
  });
}

const getAbominationWeakness = (abomination) => {
  const index = 50 > abomination?.x2
    ? 0 : 100 > abomination?.x2
      ? 3 : 150 > abomination?.x2
        ? 2 : 200 > abomination?.x2
          ? 1 : abomination?.x11 % 4;

  return { name: weaknesses?.[index] ?? 'Unknown', index };
}

const getGroupedUpgrades = (upgrades) => {
  const keyMap = {
    105: 'Elemental',
    106: 'Fighter',
    107: 'Survival',
    108: 'Nomadic',
    109: 'Abomination'
  };

  const groupedUpgrades = Object.entries(keyMap).map(([key, path]) => {
    const raw = randomList[parseInt(key)];
    let ordering = raw.split(' ').map(Number).filter(v => !isNaN(v));
    if (!ordering.length) return null;

    // Get the upgrades list based on the ordering
    const list = ordering
      .map(index => upgrades.find(upg => upg.index === index))
      .filter(Boolean);

    // Handle specific prepend for each category
    switch (path) {
      case 'Elemental':
        if (upgrades[1]) list.unshift(upgrades[1]); // Add upgrades[1] first
        break;
      case 'Fighter':
        if (upgrades[13]) list.unshift(upgrades[13]); // Add upgrades[13] first
        break;
      case 'Survival':
        if (upgrades[27]) list.unshift(upgrades[27]); // Add upgrades[27] first
        break;
      case 'Nomadic':
        if (upgrades[40]) list.unshift(upgrades[40]); // Add upgrades[40] first
        break;
      case 'default':
        // Add upgrades[0] and upgrades[170] to "default"
        if (upgrades[0]) list.unshift(upgrades[0]);
        if (upgrades[170]) list.unshift(upgrades[170]);
        break;
      default:
        break;
    }

    return { path, list };
  }).filter(Boolean);

  return [{ path: 'Default', list: [upgrades[0], upgrades[170]] }, ...groupedUpgrades];
}

const getRemainingExaltedStamps = (account, usedExaltedStamps, index) => {
  return 999 === index ?
    getCompassBonus(account, 44)
    + account?.accountOptions?.[366]
    : Math.round(getRemainingExaltedStamps(account, usedExaltedStamps, 999) - usedExaltedStamps);
}

export const getCompassStats = (character, account) => {
  const { upgrades, totalUpgradeLevels } = account?.compass;
  const defenceTalent = getTalentBonus(character?.talents, 4, 'WINDBORNE');
  const critTalent = getTalentBonus(character?.talents, 4, 'PUMPIN\'_POWER');
  const multiTalent = getTalentBonus(character?.talents, 4, 'ELEMENTAL_MAYHEM', true);
  const equipBonus = getStatsFromGear(character, 87, account);
  const equipBonus2 = getStatsFromGear(character, 88, account);
  const equipBonus3 = getStatsFromGear(character, 89, account);
  const hp = (10 + (getLocalCompassBonus(upgrades, 28) + getLocalCompassBonus(upgrades, 87)));
  const damage = 0;
  const accuracy = (3 + (getLocalCompassBonus(upgrades, 17)
    + (getLocalCompassBonus(upgrades, 19)
      + (getLocalCompassBonus(upgrades, 25)
        + getLocalCompassBonus(upgrades, 61)))));
  const defence = (1 + (getLocalCompassBonus(upgrades, 29)
      + getLocalCompassBonus(upgrades, 63)))
    * (1 + (defenceTalent
      * (totalUpgradeLevels / 100)) / 100)
    * (1 + (getLocalCompassBonus(upgrades, 30)
      * lavaLog(account?.accountOptions?.[358])) / 100)
    * (1 + equipBonus / 100)
    * (1 + (getLocalCompassBonus(upgrades, 137)
      + (getLocalCompassBonus(upgrades, 138)
        + (getLocalCompassBonus(upgrades, 141)
          + (getLocalCompassBonus(upgrades, 143)
            + (getLocalCompassBonus(upgrades, 144)
              + (getLocalCompassBonus(upgrades, 149)
                + (getLocalCompassBonus(upgrades, 83)
                  + getLocalCompassBonus(upgrades, 91)))))))) / 100);
  const mastery = Math.min(0.7, 0.2 + getLocalCompassBonus(upgrades, 70) / 100);
  const critPct = 5 + (getLocalCompassBonus(upgrades, 16)
      + critTalent
      * Math.floor(account?.breeding?.totalBreedabilityLv / 25))
    + getLocalCompassBonus(upgrades, 66);

  const critDamage = 1 + (20 + (getLocalCompassBonus(upgrades, 20)
      + getLocalCompassBonus(upgrades, 123))
    + (getLocalCompassBonus(upgrades, 75)
      + equipBonus2)) / 100;

  const attackSpeed = getLocalCompassBonus(upgrades, 21)
    + (getLocalCompassBonus(upgrades, 69)
      + equipBonus3);

  const invulnerableTime = 2.1 + (getLocalCompassBonus(upgrades, 37)
    + getLocalCompassBonus(upgrades, 88));
  const range = getLocalCompassBonus(upgrades, 32)
    + getLocalCompassBonus(upgrades, 65);
  const moveSpeed = Math.floor(100 + getLocalCompassBonus(upgrades, 35)
    + (getLocalCompassBonus(upgrades, 141)
      + getLocalCompassBonus(upgrades, 62)));

  const multiShopPct = getLocalCompassBonus(upgrades, 18)
    + (getLocalCompassBonus(upgrades, 125)
      + getLocalCompassBonus(upgrades, 73)
      + multiTalent
      * (totalUpgradeLevels / 100));

  return {
    hp,
    damage,
    accuracy,
    defence,
    mastery,
    critPct,
    critDamage,
    attackSpeed,
    invulnerableTime,
    range,
    moveSpeed,
    multiShopPct
  }
}

export const getCompassBonus = (account, index) => {
  return account?.compass?.upgrades?.[index]?.bonus || 0;
}

const getLocalCompassBonus = (upgrades, index) => {
  const upgrade = upgrades?.[index];
  return 1 === upgrade?.x9
    ? (1 + (getLocalCompassBonus(upgrades, 39) + getLocalCompassBonus(upgrades, 80)) / 100)
    * upgrade?.level * upgrade?.x5
    : 45 === index ? upgrade?.level * upgrade?.x5 * Math.pow(2, Math.floor(upgrade?.level / 50))
      : upgrade?.level * upgrade?.x5;
}

const getExtraDust = (account, upgrades) => {
  const charmBonus = getCharmBonus(account, 'Twinkle_Taffy');
  return (1 + (getLocalCompassBonus(upgrades, 31)
      + getLocalCompassBonus(upgrades, 34)
      * lavaLog(account?.accountOptions?.[359])) / 100)
    * (1 + getLocalCompassBonus(upgrades, 38) / 100)
    * (1 + charmBonus / 100)
    * (1 + (x._customBlock_EtcBonuses('85')
      + x._customBlock_EtcBonuses('79')) / 100)
    * (1 + (m.__cast(a.engine.getGameAttribute('PixelHelperActor')[8].behaviors.getBehavior('ActorEvents_481'), qa)._GenINFO[132]
      * k._customBlock_GetTalentNumber(1, 423)) / 100)
    * (1 + (getLocalCompassBonus(upgrades, 139)
      + (getLocalCompassBonus(upgrades, 142)
        + (getLocalCompassBonus(upgrades, 145)
          + (getLocalCompassBonus(upgrades, 148)
            + (getLocalCompassBonus(upgrades, 150)
              + (getLocalCompassBonus(upgrades, 68)
                + (getLocalCompassBonus(upgrades, 93)
                  + (getLocalCompassBonus(upgrades, 89)
                    + k._customBlock_GetTalentNumber(1, 421))))))))) / 100);
}

const getUpgradeCost = (upgrades, index, serverVars) => {
  // Set base cost reduction and surplus
  let redCost = 1;
  let surplusCost = 0;

// Adjust WWzCostRed based on the value of `t`
  switch (index) {
    case 45:
      redCost = 1 + (
        getLocalCompassBonus(upgrades, 151) +
        getLocalCompassBonus(upgrades, 152) +
        getLocalCompassBonus(upgrades, 153)
      ) / 100;
      break;

    case 43:
      redCost = 1 + (
        getLocalCompassBonus(upgrades, 154) +
        getLocalCompassBonus(upgrades, 156)
      ) / 100;
      break;

    case 48:
      redCost = 1 + (
        getLocalCompassBonus(upgrades, 155) +
        getLocalCompassBonus(upgrades, 157) +
        getLocalCompassBonus(upgrades, 158)
      ) / 100;
      break;

    case 57:
      redCost = 1 + (
        getLocalCompassBonus(upgrades, 159) +
        getLocalCompassBonus(upgrades, 160) +
        getLocalCompassBonus(upgrades, 161) +
        getLocalCompassBonus(upgrades, 168)
      ) / 100;
      break;

    case 51:
      redCost = 1 + (
        getLocalCompassBonus(upgrades, 162) +
        getLocalCompassBonus(upgrades, 163) +
        getLocalCompassBonus(upgrades, 164) +
        getLocalCompassBonus(upgrades, 166) +
        getLocalCompassBonus(upgrades, 167)
      ) / 100;
      break;

    case 54:
      redCost = 1 + (
        getLocalCompassBonus(upgrades, 165) +
        getLocalCompassBonus(upgrades, 169)
      ) / 100;
      break;
  }

// Check for "Path" bonus in CompassUpg
  const compassUpgPath = compass?.[index]?.x10 + '';
  const upgrade = upgrades?.[index];
  if (compassUpgPath.includes('Path')) {
    surplusCost = (Math.pow(3 * upgrade?.level, 2) + 12 * upgrade?.level) * Math.pow(1.1, upgrade?.level);
  }

// Final cost calculation
  const dustCost = Math.max(serverVars?.DustCost, 1);
  const bonusReduction = 1 + (
    getLocalCompassBonus(upgrades, 36) +
    getLocalCompassBonus(upgrades, 77)
  ) / 100;

  const compassUpg = compass?.[index];
  const randoListIndex = Math.round(105 + compassUpg?.x10);
  const randoList = randomList[randoListIndex]?.split(' ');
  const randoMultiplier = Math.max(1, Math.pow(3.2 - randoList.length / 60, randoList.indexOf('' + index)));

  const finalCost = (
    surplusCost +
    dustCost * (1 / bonusReduction) *
    (1 / Math.max(1, redCost)) *
    (compassUpg?.x1 / 2) *
    randoMultiplier *
    Math.pow(compassUpg?.x2, upgrade?.level)
  );

  return finalCost;
}