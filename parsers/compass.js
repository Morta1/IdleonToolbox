import {
  commaNotation,
  excludedPortals,
  getFilteredPortals,
  lavaLog,
  notateNumber,
  tryToParse
} from '@utility/helpers';
import {
  abominations,
  compass,
  items,
  mapDetails,
  mapEnemiesArray,
  mapNames,
  mapPortals,
  monsterDrops,
  monsters,
  randomList
} from '../data/website-data';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { getTalentBonus } from '@parsers/talents';
import { getStatsFromGear } from '@parsers/items';
import { getArcadeBonus } from '@parsers/arcade';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getEventShopBonus } from '@parsers/misc';
import { altStampsMapping } from '@parsers/stamps';
import { getOptimizedGenericUpgrades } from './genericUpgradeOptimizer';

export const dustNames = {
  0: 'Stardust',
  1: 'Moondust',
  2: 'Solardust',
  3: 'Cooldust',
  4: 'Novadust'
};

export const UPGRADE_CATEGORIES = {
  damage: {
    name: 'Damage',
    stats: ['damage'],
    upgradeIndices: [6, 8, 10, 23, 113, 112, 14, 119, 15, 122, 123, 121, 129, 130, 127, 24, 132, 135, 126, 48, 155, 157,
      158,
      60, 64, 74, 75, 81, 85, 94]
  },
  dust: {
    name: 'Dust',
    stats: ['dust'],
    upgradeIndices: [139, 142, 34, 145, 31, 38, 33, 148, 150, 68, 86, 89, 93]
  },
  accuracy: {
    name: 'Accuracy',
    stats: ['accuracy'],
    upgradeIndices: [6, 17, 22, 120, 124, 19, 22, 125, 134, 128, 133, 25, 131, 136, 147, 61, 79, 84, 90]
  },
  defence: {
    name: 'Defence',
    stats: ['defence'],
    upgradeIndices: [29, 137, 30, 141, 138, 144, 149, 143, 63, 83, 91]
  },
  crit: {
    name: 'Crit',
    stats: ['critPct', 'critDamage'],
    upgradeIndices: [16, 123, 20, 42, 66, 75]
  },
  attackSpeed: {
    name: 'Attack Speed',
    stats: ['attackSpeed'],
    upgradeIndices: [21, 69]
  },
  hp: {
    name: 'HP',
    stats: ['hp'],
    upgradeIndices: [10, 28, 78, 84, 87, 92]
  }
};

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
  const dusts = accountData?.accountOptions?.slice(357, 362).map((value, index) => ({
    value,
    name: dustNames?.[index]
  }));
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
      const forceUnlock = excludedPortals[mapIndex]?.includes(portalIndex);
      return {
        costQuantity,
        costType,
        unlocked: forceUnlock || unlockedPortals?.[mapIndex + '_' + portalIndex]
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
  let topOfTheMorninKills;
  upgrades = upgrades.map((upgrade, index) => {
    const bonus = getLocalCompassBonus(upgrades, index);
    const nextLevelBonus = getCompassBonusAtLevel(upgrades, index, upgrade?.level + 1);
    const cost = getUpgradeCost(upgrades, index, serverVars);
    const isMulti = upgrade?.description.includes('}');
    let extraData;
    if (upgrade?.name === 'Top_of_the_Mornin\'') {
      const killsLeft = Math.max(0, accountData?.accountOptions?.[365]);
      const totalKills = getLocalCompassBonus(upgrades, 9) + getLocalCompassBonus(upgrades, 71);
      topOfTheMorninKills = `${totalKills - killsLeft} / ${totalKills}`;
      extraData = `Kills: ${topOfTheMorninKills}`
    }
    return {
      ...upgrade,
      bonus,
      nextLevelBonus,
      bonusDiff: nextLevelBonus - bonus,
      cost,
      isMulti,
      description: upgrade?.description.replace(/{/g, commaNotation(bonus)).replace(/}/g, notateNumber(1 + bonus / 100, 'MultiplierInfo')),
      extraData
    }
  });

  const medallions = getMedallions((medallionsRaw || []).toSimpleObject(), upgrades)

  const exaltedStamps = (exaltedStampsRaw || []).reduce((result, stamp) => {
    const [, category, stampIndex] = stamp.match(/^([a-zA-Z_]+)(\d+)$/);
    const categoryName = altStampsMapping?.[category];
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
    groupedUpgrades: getGroupedUpgrades(upgrades, abominationsList),
    abominations: abominationsList,
    medallions,
    maps,
    totalAcquiredMedallions: medallionsRaw?.length,
    totalKilledAbominations: abominationsRaw?.reduce((sum, killed) => killed > 0 ? sum + 1 : sum, 0),
    dusts,
    exaltedStamps,
    usedExaltedStamps: exaltedStampsRaw?.length,
    remainingExaltedStamps,
    totalUpgradeLevels,
    totalDustsCollected,
    topOfTheMorninKills
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

const getMedallions = (medallions, upgrades) => {
  return Array.from(
    new Map(
      randomList?.[112]?.split(' ').map((monsterRawName) => {
        const coinQuantity = monsterDrops?.[monsterRawName]?.find(({ rawName }) => rawName === 'COIN')?.quantity;
        const bowDrop = 5 > Math.floor(coinQuantity / 3) % 16 ? (1 <= getLocalCompassBonus(upgrades, 3)
          ? Math.floor(coinQuantity / 3) % 16 : -1) : 670 === coinQuantity
        || 2500 === coinQuantity || 13e4 === coinQuantity
          ? 4 : 1850 === coinQuantity || 7e3 === coinQuantity || 19e3 === coinQuantity || 16e4 === coinQuantity
            ? 3
            : -1;
        const ringDrop = 9 > Math.floor(coinQuantity / 2) % 42
          ? (1 <= getLocalCompassBonus(upgrades, 12)
            ? Math.floor(coinQuantity / 2) % 42
            : -1)
          : 460 === coinQuantity || 1260 === coinQuantity || 2300 === coinQuantity || 8500 === coinQuantity || 8e4 === coinQuantity
            ? 3
            : -1;
        const weakness = Math.round(coinQuantity / 17) % 4;
        const dustType = 145e3 === Math.floor(coinQuantity) || 72e3 === Math.floor(coinQuantity) || 2700 === Math.floor(coinQuantity) || -1 === Math.floor(coinQuantity)
          ? 0
          : 310 === Math.floor(coinQuantity) || 770 === Math.floor(coinQuantity) || 1500 === Math.floor(coinQuantity) || 29e3 === Math.floor(coinQuantity)
            ? 1
            : 4e5 === Math.floor(coinQuantity) || 98500 === Math.floor(coinQuantity) || 865 === Math.floor(coinQuantity) || -1 === Math.floor(coinQuantity)
              ? 2
              : 89e3 === Math.floor(coinQuantity) || 12500 === Math.floor(coinQuantity) || 5e4 === Math.floor(coinQuantity) || -1 === Math.floor(coinQuantity)
                ? 3
                : 5e3 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 35) % 4, 3) : 1e3 <= coinQuantity
                  ? Math.min(Math.floor(coinQuantity / 35) % 3, 2)
                  : 350 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 35) % 2, 1) : 0;
        const dustBaseQuantity = 3 <= dustType
          ? Math.pow(Math.max(1, coinQuantity - 4999) / 3, 0.9) : 2 <= dustType
            ? Math.pow(Math.max(1, coinQuantity - 999) / 3, 0.9) : 1 <= dustType
              ? Math.pow(Math.max(1, coinQuantity - 349) / 2, 0.9) : Math.pow(Math.max(1, coinQuantity) / 2, 0.9);
        // Description logic
        let description = undefined;
        if (monsterRawName === 'rockS') description = 'W3 Colo';
        else if (['Meteor', 'rocky', 'snakeZ', 'iceknight',
          'frogGR'].includes(monsterRawName)) description = 'Event Boss';
        else if (
          ['poopBig', 'babayaga', 'babaHour', 'babaMummy', 'mini3a', 'mini4a', 'mini5a',
            'mini6a'].includes(monsterRawName)
        ) description = 'Boss';
        else if (/^Crystal\d$/.test(monsterRawName)) description = 'Glitterbug prayer';
        else if (/^Chest[ABC]\d$/.test(monsterRawName)) description = `W ${monsterRawName.slice(-1)}`;

        // Chest logic
        let customName = undefined;
        const chestMatch = monsterRawName.match(/^Chest([ABC])(\d)$/);
        if (chestMatch) {
          const [, type, wave] = chestMatch;
          description = `W ${wave}`;
          customName =
            type === 'A'
              ? 'Bronze_Chest'
              : type === 'B'
                ? 'Silver_Chest'
                : 'Golden_Chest';
        }

        return [
          monsterRawName,
          {
            ...monsters[monsterRawName],
            ...(customName ? { Name: customName } : {}),
            acquired: medallions?.[monsterRawName],
            weakness,
            drops: [
              (bowDrop !== -1 ? { ...items?.[`EquipmentBowsTempest${bowDrop}`] } : null),
              (ringDrop !== -1 ? { ...items?.[`EquipmentRingsTempest${ringDrop}`] } : null)
            ].filter(Boolean),
            description,
            dustType,
            dustBaseQuantity
          }
        ];
      })
    ).values()
  );
}

const getAbominationWeakness = (abomination) => {
  const index = 50 > abomination?.x2
    ? 0 : 100 > abomination?.x2
      ? 3 : 150 > abomination?.x2
        ? 2 : 200 > abomination?.x2
          ? 1 : abomination?.x11 % 4;

  return { name: weaknesses?.[index] ?? 'Unknown', index };
}

const getGroupedUpgrades = (upgrades, abominations) => {
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

    let list = ordering
      .map(index => upgrades.find(upg => upg.index === index))
      .filter(Boolean);

    // Prepend specific upgrades based on path
    switch (path) {
      case 'Elemental':
        if (upgrades[1]) list.unshift(upgrades[1]);
        break;
      case 'Fighter':
        if (upgrades[13]) list.unshift(upgrades[13]);
        break;
      case 'Survival':
        if (upgrades[27]) list.unshift(upgrades[27]);
        break;
      case 'Nomadic':
        if (upgrades[40]) list.unshift(upgrades[40]);
        break;
    }
    if (path === 'Abomination') {
      list = list.map((upg, i) => ({
        ...upg,
        unlocked: !!abominations?.[i]?.unlocked
      }));
    }
    else {
      // Apply "unlocked" based on first upgrade's level
      const unlockedCount = list[0]?.level ?? 0;
      list = list.map((upg, i) => ({
        ...upg,
        unlocked: i <= unlockedCount,
        unlocksAt: i
      }));
    }

    return { path, list };
  }).filter(Boolean);

  // Handle "Default" group separately
  const defaultList = [upgrades[0], upgrades[170]].filter(Boolean);
  const defaultUnlockedCount = defaultList[0]?.level ?? 0;
  const defaultListWithUnlocks = defaultList.map((upg, i) => ({
    ...upg,
    unlocked: i <= defaultUnlockedCount
  }));
  return [{ path: 'Default', list: defaultListWithUnlocks }, ...groupedUpgrades];
}

const getRemainingExaltedStamps = (account, usedExaltedStamps, index) => {
  return 999 === index ?
    getCompassBonus(account, 44)
    + account?.accountOptions?.[366]
    + getEventShopBonus(account, 18)
    : Math.round(getRemainingExaltedStamps(account, usedExaltedStamps, 999) - usedExaltedStamps);
}

export const getCompassStats = (character, account) => {
  const { upgrades, totalUpgradeLevels } = account?.compass;
  const defenceAndAccTalent = getTalentBonus(character?.flatTalents, 'WINDBORNE');
  const critTalent = getTalentBonus(character?.flatTalents, 'PUMPIN\'_POWER');
  const multiTalent = getTalentBonus(character?.flatTalents, 'ELEMENTAL_MAYHEM', true);
  const tempestTalent = getTalentBonus(character?.flatTalents, 'TEMPEST_FORM');
  const equipBonus = getStatsFromGear(character, 87, account);
  const equipBonus2 = getStatsFromGear(character, 88, account);
  const equipBonus3 = getStatsFromGear(character, 89, account);
  const equipBonus4 = getStatsFromGear(character, 86, account);
  const hp = (10 + (getLocalCompassBonus(upgrades, 28)
      + getLocalCompassBonus(upgrades, 87)))
    * (1 + (getLocalCompassBonus(upgrades, 140)
      + (getLocalCompassBonus(upgrades, 146)
        + getLocalCompassBonus(upgrades, 92))) / 100);
  let equipmentWeaponPower = 0;
  const bowWeaponPower = character?.equipment?.[1];
  const ringWeaponPower = character?.equipment?.[5];
  const ring2WeaponPower = character?.equipment?.[7];
  if (bowWeaponPower?.name?.includes('Tempest')) {
    equipmentWeaponPower += bowWeaponPower?.Weapon_Power;
  }
  if (ringWeaponPower?.name?.includes('Tempest')) {
    equipmentWeaponPower += ringWeaponPower?.Weapon_Power;
  }
  if (ring2WeaponPower?.name?.includes('Tempest')) {
    equipmentWeaponPower += ring2WeaponPower?.Weapon_Power;
  }
  const damage = 5 + (getLocalCompassBonus(upgrades, 14)
      + (getLocalCompassBonus(upgrades, 15)
        + (getLocalCompassBonus(upgrades, 24)
          + (getLocalCompassBonus(upgrades, 60)
            + getLocalCompassBonus(upgrades, 81)))))
    * Math.pow(1.05, equipmentWeaponPower)
    * (1 + equipBonus4 / 100)
    * (1 + (getLocalCompassBonus(upgrades, 23)
      * lavaLog(account?.accountOptions?.[360])) / 100)
    * Math.pow(1 + getLocalCompassBonus(upgrades, 26) / 100, account?.accountOptions?.[232])
    * (1 + (getLocalCompassBonus(upgrades, 6) * account?.compass?.totalAcquiredMedallions) / 100)
    * (1 + (getLocalCompassBonus(upgrades, 119) + (getLocalCompassBonus(upgrades, 121)
      + (getLocalCompassBonus(upgrades, 122) + (getLocalCompassBonus(upgrades, 123)
        + (getLocalCompassBonus(upgrades, 126) + (getLocalCompassBonus(upgrades, 127)
          + (getLocalCompassBonus(upgrades, 129) + (getLocalCompassBonus(upgrades, 130)
            + (getLocalCompassBonus(upgrades, 132) + (getLocalCompassBonus(upgrades, 135)
              + (getLocalCompassBonus(upgrades, 64) + getLocalCompassBonus(upgrades, 78)
                * lavaLog(hp) +
                (getLocalCompassBonus(upgrades, 85) + (getLocalCompassBonus(upgrades, 94)
                  + tempestTalent))))))))))))) / 100);
  const accuracy = (3 + (getLocalCompassBonus(upgrades, 17)
      + (getLocalCompassBonus(upgrades, 19)
        + (getLocalCompassBonus(upgrades, 25)
          + getLocalCompassBonus(upgrades, 61)))))
    * (1 + (defenceAndAccTalent
      * (totalUpgradeLevels / 100)) / 100)
    * (1 + (getLocalCompassBonus(upgrades, 22)
      * lavaLog(account?.accountOptions?.[357])) / 100)
    * (1 + (getLocalCompassBonus(upgrades, 6) * account?.compass?.totalAcquiredMedallions) / 100)
    * (1 + (getLocalCompassBonus(upgrades, 120) + (getLocalCompassBonus(upgrades, 124)
      + (getLocalCompassBonus(upgrades, 125) + (getLocalCompassBonus(upgrades, 128)
        + (getLocalCompassBonus(upgrades, 131) + (getLocalCompassBonus(upgrades, 133)
          + (getLocalCompassBonus(upgrades, 134) + (getLocalCompassBonus(upgrades, 136)
            + (getLocalCompassBonus(upgrades, 147) + (getLocalCompassBonus(upgrades, 84)
              * lavaLog(hp)
              + (getLocalCompassBonus(upgrades, 79)
                + getLocalCompassBonus(upgrades, 90)))))))))))) / 100);
  const defence = (1 + (getLocalCompassBonus(upgrades, 29)
      + getLocalCompassBonus(upgrades, 63)))
    * (1 + (defenceAndAccTalent
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

const getCompassBonusAtLevel = (upgrades, index, levelOverride) => {
  const tempUpgrades = upgrades.map((u, i) =>
    i === index ? { ...u, level: levelOverride } : { ...u }
  );

  return getLocalCompassBonus(tempUpgrades, index);
};
const getLocalCompassBonus = (upgrades, index) => {
  const upgrade = upgrades?.[index];
  return 1 === upgrade?.x9
    ? (1 + (getLocalCompassBonus(upgrades, 39) + getLocalCompassBonus(upgrades, 80)) / 100)
    * upgrade?.level * upgrade?.x5
    : 45 === index ? upgrade?.level * upgrade?.x5 * Math.pow(2, Math.floor(upgrade?.level / 50))
      : upgrade?.level * upgrade?.x5;
}

export const getExtraDust = (character, account) => {
  const upgrades = account?.compass?.upgrades;
  const equipBonus = getStatsFromGear(character, 85, account) ?? 0;
  const equipBonus1 = getStatsFromGear(character, 79, account) ?? 0;
  const dustTalent = getTalentBonus(character?.flatTalents, 'ETERNAL_HUNT');
  const compassTalent = getTalentBonus(character?.flatTalents, 'COMPASS');
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Windwalker_Dust')?.bonus;

  const charmBonus = getCharmBonus(account, 'Twinkle_Taffy');
  const emperorBonus = getEmperorBonus(account, 4);

  return (1 +
      (getLocalCompassBonus(upgrades, 31)
        + getLocalCompassBonus(upgrades, 34)
        * lavaLog(account?.accountOptions?.[359])) / 100)
    * (1 + getLocalCompassBonus(upgrades, 38) / 100)
    * (1 + charmBonus / 100)
    * (1 + (equipBonus + equipBonus1) / 100)
    * (1 + emperorBonus / 100)
    * (1 + (0 * dustTalent) / 100)
    * (1 + (getLocalCompassBonus(upgrades, 139)
      + (getLocalCompassBonus(upgrades, 142)
        + (getLocalCompassBonus(upgrades, 145)
          + (getLocalCompassBonus(upgrades, 148)
            + (getLocalCompassBonus(upgrades, 150)
              + (getLocalCompassBonus(upgrades, 68)
                + (getLocalCompassBonus(upgrades, 93)
                  + (getLocalCompassBonus(upgrades, 89)
                    + (compassTalent
                      + arcadeBonus))))))))) / 100);
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

export const getOptimizedUpgrades = (character, account, category = 'damage', maxUpgrades = 100, options = {}) => {
  const categoryInfo = UPGRADE_CATEGORIES[category];
  if (category === 'dust') {
    options.getExtraDust = getExtraDust;
  }
  return getOptimizedGenericUpgrades({
    character,
    account,
    category,
    maxUpgrades,
    categoryInfo,
    getUpgrades: acc => (acc?.compass?.groupedUpgrades || {}).flatMap(({ list }) => list).toSorted((a, b) => a.index - b.index) || [],
    getResources: acc => acc?.compass?.dusts || [],
    getCurrentStats: (upgrades, char, acc) => getCompassStats(char, { ...acc, compass: { ...acc.compass, upgrades } }),
    getUpgradeCost: (upgrade, index, { account, upgrades }) => getUpgradeCost(upgrades, index, account?.serverVars),
    applyUpgrade: (upgrade, upgradesArr) => upgradesArr.map(u => u.index === upgrade.index ? {
      ...u,
      level: u.level + 1
    } : u),
    updateResourcesAfterUpgrade: (resources, upgrade, resourceNames, cost) => {
      const dustType = dustNames[upgrade.x3];
      const resource = resources.find(r => r.name === dustType);
      if (resource) resource.value -= cost;
    },
    resourceNames: dustNames,
    extraArgs: options
  });
}