import { commaNotation, lavaLog, notateNumber, tryToParse } from '@utility/helpers';
import { grimoire, mapEnemiesArray, mapNames, monsterDrops, monsters, randomList } from '../data/website-data';
import { getHighestTalentByClass } from '@parsers/talents';
import { getStatsFromGear } from '@parsers/items';
import { getCharacterByHighestLevel } from '@parsers/misc';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getEmperorBonus } from '@parsers/world-6/emperor';

export const boneNames = [
  'Femur',
  'Ribcage',
  'Cranium',
  'Bovinae'
];

export const getGrimoire = (idleonData, charactersData, accountData) => {
  const grimoireRaw = tryToParse(idleonData?.Grimoire) || idleonData?.Grimoire;
  const ribbonRaw = tryToParse(idleonData?.Ribbon) || idleonData?.Ribbon;
  return parseGrimoire(grimoireRaw, ribbonRaw, charactersData, accountData);
};

const parseGrimoire = (grimoireRaw, ribbonRaw, charactersData, accountData) => {
  const monsterList = randomList?.[104]?.split(' ');
  const bones = accountData?.accountOptions?.slice(330, 334);
  const totalUpgradeLevels = grimoireRaw?.reduce((sum, level) => sum + level, 0);
  const totalBonesCollected = accountData?.accountOptions?.[329];
  let upgrades = grimoire.map((upgrade, index) => {
    const { x1, x2 } = upgrade;
    const level = grimoireRaw?.[index]
    const cost = getUpgradeCost({ x1, x2, index, level })
    return {
      ...upgrade,
      index,
      level,
      cost
    }
  });
  upgrades = upgrades.map((upgrade, index) => {
    const bonus = calcGrimoireBonus(upgrades, index);
    return {
      ...upgrade,
      unlocked: upgrade?.unlockLevel < totalUpgradeLevels,
      bonus,
      monsterProgress: getMonsterProgress(monsterList, accountData, index),
      description: upgrade?.description.replace('{', commaNotation(bonus)).replace('}', notateNumber(1 + bonus / 100, 'MultiplierInfo'))
    }
  })
  const nextUnlock = upgrades?.find(({ unlocked }) => !unlocked);
  const wraith = getWraithStats(upgrades, totalUpgradeLevels, charactersData, accountData);

  return {
    totalUpgradeLevels,
    bones,
    upgrades,
    nextUnlock,
    wraith,
    totalBonesCollected,
    monsterDrops: getMonsterDrops(),
    ribbons: ribbonRaw
  };
}

const getMonsterDrops = () => {
  const excludedMaps = [
    'Nothing', 'Z', 'Copper',
    'Iron', 'Starfire', 'Plat', 'Void',
    'Filler', 'JungleZ', 'Grandfrog\'s_Gazebo',
    'Grandfrog\'s_Backyard', 'Gravel_Tomb', 'Heaty_Hole',
    'Igloo\'s_Basement', 'Inside_the_Igloo', 'End_Of_The_Road',
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll',
    'Chizoar\'s_Cavern', 'KattleKruk\'s_Volcano', 'Castle_Interior'].toSimpleObject();
  const list = Object.values(mapNames).map((mapName, index) => {
    const monsterRawName = mapEnemiesArray?.[index];
    const coinQuantity = monsterDrops?.[monsterRawName]?.find(({ rawName }) => rawName === 'COIN')?.quantity;
    const boneType = 6e3 === Math.floor(coinQuantity)
    || 12500 === Math.floor(coinQuantity) || 22e3 === Math.floor(coinQuantity) ||
    35e4 === Math.floor(coinQuantity) ? 0 : 4e5 === Math.floor(coinQuantity) ?
      1 : 3700 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 27) % 4, 3)
        : 740 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 27) % 3, 2) :
          190 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 27) % 2, 1) : 0;
    const boneQuantity = 3 <= boneType
      ? Math.pow(Math.max(1, coinQuantity - 3699), 0.9) : 2 <= boneType
        ? Math.pow(Math.max(1, coinQuantity - 739), 0.9) : 1 <= boneType
          ? Math.pow(Math.max(1, coinQuantity - 189), 0.9) : Math.pow(Math.max(coinQuantity, coinQuantity), 0.9);
    return {
      ...monsters?.[monsterRawName],
      rawName: monsterRawName,
      mapName,
      boneType,
      boneQuantity
    }
  }).filter(({
               mapName,
               AFKtype
             }) => AFKtype === 'FIGHTING' && !excludedMaps[mapName] && !AFKtype.includes('Fish') && !AFKtype.includes('Bug') && !mapName.includes('Colosseum'));

  // Filter to get the final list with unique items by rawName
  return list.filter((item, index, self) =>
    index === self.findIndex((t) => t.rawName === item.rawName)
  );

}

const getMonsterProgress = (monsterList, accountData, index) => {
  let selectedIndex;
  if (index === 13) {
    selectedIndex = 334;
  } else if (index === 21) {
    selectedIndex = 335;
  } else if (index === 31) {
    selectedIndex = 336;
  }
  return monsters?.[monsterList?.[accountData?.accountOptions?.[selectedIndex]]]?.Name;
}

const getWraithStats = (upgrades, totalUpgradeLevels, characters, accountData) => {
  const bulwarkStyle = getHighestTalentByClass(characters, 4, 'Death_Bringer', 'BULWARK_STYLE');
  const wraithForm = getHighestTalentByClass(characters, 4, 'Death_Bringer', 'WRAITH_FORM');
  const marauderStyle = getHighestTalentByClass(characters, 4, 'Death_Bringer', 'MARAUDER_STYLE');
  const famineFishX = getHighestTalentByClass(characters, 4, 'Death_Bringer', 'FAMINE_O\'_FISH');
  const famineFishY = getHighestTalentByClass(characters, 4, 'Death_Bringer', 'FAMINE_O\'_FISH', true);
  const hp = (10 + (calcGrimoireBonus(upgrades, 3)
      + (calcGrimoireBonus(upgrades, 19)
        + (calcGrimoireBonus(upgrades, 34)
          + calcGrimoireBonus(upgrades, 42)))))
    * (1 + (calcGrimoireBonus(upgrades, 7)
      + calcGrimoireBonus(upgrades, 38)) / 100)
    * (1 + (bulwarkStyle
      * (totalUpgradeLevels / 100)) / 100);
  const damage = (5 + (calcGrimoireBonus(upgrades, 0)
      + (calcGrimoireBonus(upgrades, 6)
        + (calcGrimoireBonus(upgrades, 16)
          + (calcGrimoireBonus(upgrades, 33)
            + calcGrimoireBonus(upgrades, 46))))))
    * (1 + wraithForm / 100)
    * (1 + (calcGrimoireBonus(upgrades, 8)
      + (calcGrimoireBonus(upgrades, 28)
        + (calcGrimoireBonus(upgrades, 43)
          + calcGrimoireBonus(upgrades, 50)))) / 100)
    * (1 + (accountData?.accountOptions?.[334]
      * calcGrimoireBonus(upgrades, 13)
      + (accountData?.accountOptions?.[335]
        * calcGrimoireBonus(upgrades, 21)
        + accountData?.accountOptions?.[336]
        * calcGrimoireBonus(upgrades, 31))) / 100)
    * (1 + (calcGrimoireBonus(upgrades, 18)
      * lavaLog(accountData?.accountOptions?.[330])) / 100)
    * (1 + (marauderStyle * (totalUpgradeLevels / 100)) / 100);
  const accuracy = (2 + (calcGrimoireBonus(upgrades, 1)
      + (calcGrimoireBonus(upgrades, 12)
        + (calcGrimoireBonus(upgrades, 25)
          + (calcGrimoireBonus(upgrades, 37)
            + calcGrimoireBonus(upgrades, 47))))))
    * (1 + (calcGrimoireBonus(upgrades, 7)
      + calcGrimoireBonus(upgrades, 38)) / 100)
    * (1 + (calcGrimoireBonus(upgrades, 41)
      * lavaLog(accountData?.accountOptions?.[332])) / 100)
    * (1 + (marauderStyle
      * (totalUpgradeLevels / 100)) / 100);
  const defence = (calcGrimoireBonus(upgrades, 2)
      + (calcGrimoireBonus(upgrades, 15)
        + (calcGrimoireBonus(upgrades, 30)
          + (calcGrimoireBonus(upgrades, 40)
            + calcGrimoireBonus(upgrades, 49)))))
    * (1 + (calcGrimoireBonus(upgrades, 7)
      + calcGrimoireBonus(upgrades, 38)) / 100)
    * (1 + (calcGrimoireBonus(upgrades, 27)
      * lavaLog(accountData?.accountOptions?.[331])) / 100)
    * (1 + (bulwarkStyle
      * (totalUpgradeLevels / 100)) / 100);
  const critChance = 10 + (calcGrimoireBonus(upgrades, 10)
    + famineFishX
    * lavaLog(1)) // TODO: calculate fishing efficiency
  const critDamage = 1 + (25 + calcGrimoireBonus(upgrades, 20)
    + famineFishY
    * lavaLog(1)) / 100;
  const baseExtraBones = getExtraBonesBonus(upgrades, characters, accountData);
  return {
    hp,
    damage,
    accuracy,
    defence,
    critChance,
    critDamage,
    extraBones: baseExtraBones
  };
}

const getUpgradeCost = ({ index, level, x1, x2 }) => {
  return 3 * Math.pow(1.05, index) * (level + (x1 + level) * Math.pow(x2 + 0.01, level));
}

const getExtraBonesBonus = (upgrades, characters, accountData) => {
  const grimoire = getHighestTalentByClass(characters, 4, 'Death_Bringer', 'GRIMOIRE');
  const highestLevelDeathBringer = getCharacterByHighestLevel(characters, 'Death_Bringer');
  const graveyardShift = getHighestTalentByClass(characters, 4, 'Death_Bringer', 'GRAVEYARD_SHIFT');

  const gearBonus = getStatsFromGear(highestLevelDeathBringer, 76, accountData);
  const emperorBonus = getEmperorBonus(accountData, 1);

  return (1 + grimoire / 100)
    * Math.min(2, 1 + getGambitBonus(accountData, 12))
    * Math.min(1.5, 1 + gearBonus / 100)
    * (1 + emperorBonus / 100)
    * (1 + (calcGrimoireBonus(upgrades, 23) +
      calcGrimoireBonus(upgrades, 48)
      * lavaLog(accountData?.accountOptions?.[333])) / 100)
    * (1 + (1 * graveyardShift) / 100);
}

export const getGrimoireBonus = (upgrades, index) => {
  return upgrades?.[index]?.bonus || 0;
}

export const calcGrimoireBonus = (upgrades, index) => {
  const upgrade = upgrades?.[index];
  return 9 === index || 11 === index || 26 === index || 36 === index || 39 === index || 17 === index || 32 === index || 45 === index
    ? upgrade?.level
    * upgrade?.x5
    : upgrade?.level
    * upgrade?.x5
    * (1 + calcGrimoireBonus(upgrades, 36) / 100);

}