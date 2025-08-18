import { cards, cardSets, chips, items, prayers, starSignByIndexMap } from './website-data.js';

const getPrayer = (prayerName) => {
  return prayers?.find(({ name }) => name === prayerName);
}

export const samplingSetups = {
  'afk-fighting': {
    name: 'AFK Fighting',
    weaponByClass: {
      Beginner: 'EquipmentPunching9',
      Warrior: 'EquipmentSword7',
      Archer: 'EquipmentBows12',
      Mage: 'EquipmentWands11'
    },
    equipment: [
      items['EquipmentHats119'],
      items['EquipmentBows12'],
      items['EquipmentShirts36'],
      items['EquipmentPendant30'],
      items['EquipmentPants27'],
      items['EquipmentRings35'],
      items['EquipmentShoes40'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain22'],
      items['Trophy23'],
      items['EquipmentKeychain22'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag19'],
      items['EquipmentGown4']
    ],
    tools: [
      { rawName: 'Blank' },
      { rawName: 'Blank' },
      { rawName: 'Blank' },
      items['TrapBoxSet10'],
      items['WorshipSkull11']
    ],
    food: [
      items['FoodG2'],
      items['FoodG9'],
      items['FoodG12'],
      items['Bullet3'],
      items['MidnightCookie'],
      items['FoodPotGr4']
    ],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[10], count: 2 },
      { chip: chips[18], count: 1 },
      { chip: chips[17], count: 1 },
      { chip: chips[15], count: 1 }
    ],
    cardSet: cardSets['{%_Multikill_Per_Tier'],
    cards: [
      cards.wolfB,
      cards.poopD,
      cards.mini6a,
      cards.Boss6B,
      cards.w4c1,
      cards.w5a1,
      cards.w6a5,
      cards.Boss6C
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Beefy_For_Real'),
      getPrayer('Balance_of_Pain'),
      getPrayer('Fibers_of_Absence')
    ],
    obols: [
      items.ObolKruk,
      items.ObolChizoarA,
      items.ObolPlatinumKill,
      items.ObolHyper3,
      items.ObolHyperB1,
      items.ObolPlatinum1
    ],
    starSigns: [
      { starSign: starSignByIndexMap[56], starSignIndex: 56, bonusIndex: 0 },
      { starSign: starSignByIndexMap[49], starSignIndex: 49, bonusIndex: 0 },
      { starSign: starSignByIndexMap[28], starSignIndex: 28, bonusIndex: 2 }
    ]
  },
  'chopping': {
    name: 'Chopping',
    equipment: [
      items['EquipmentHats119'],
      items['EquipmentWands13'],
      items['EquipmentShirts39'],
      items['EquipmentPendant30'],
      items['EquipmentPants31'],
      items['EquipmentRings35'],
      items['EquipmentShoes27'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain19'],
      items['Trophy23'],
      items['EquipmentKeychain19'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag19'],
      items['EquipmentGown4']
    ],
    tools: [
      items['EquipmentToolsHatchet10'],
      { rawName: 'Blank' },
      { rawName: 'Blank' },
      items['TrapBoxSet10'],
      items['WorshipSkull11']
    ],
    food: [
      items['FoodG12'],
      items['FoodG9'],
      items['FoodChoppin1'],
      items['FoodEvent2']
    ],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[20], count: 1 },
      { chip: chips[18], count: 1 },
      { chip: chips[17], count: 1 },
      { chip: chips[15], count: 1 },
      { chip: chips[16], count: 1 },
      { chip: chips[8], count: 1 }
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.wolfA,
      cards.w6b3,
      cards.CritterCard7,
      cards.Boss3C,
      cards.w6a3,
      cards.w5c2,
      cards.w4c4,
      cards.Boss4B
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Skilled_Dimwit')
    ],
    obols: [
      items.ObolEmp,
      items.ObolKruk,
      items.ObolSlush,
      items.ObolHyperB1,
      items.ObolGoldChoppin,
      items.ObolSilverChoppin,
      items.ObolHyper1
    ],
    starSigns: [
      { starSign: starSignByIndexMap[69], starSignIndex: 69, bonusIndex: 0 },
      { starSign: starSignByIndexMap[55], starSignIndex: 55, bonusIndex: 0 },
      { starSign: starSignByIndexMap[5], starSignIndex: 5, bonusIndex: 0 }
    ]
  },
  'mining': {
    name: 'Mining',
    equipment: [
      items['EquipmentHats119'],
      items['EquipmentSword9'],
      items['EquipmentShirts39'],
      items['EquipmentPendant30'],
      items['EquipmentPants31'],
      items['EquipmentRings35'],
      items['EquipmentShoes26'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain19'],
      items['Trophy23'],
      items['EquipmentKeychain19'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag19'],
      items['EquipmentGown4']
    ],
    tools: [
      items['EquipmentTools15'],
      { rawName: 'Blank' },
      { rawName: 'Blank' },
      items['TrapBoxSet10'],
      items['WorshipSkull11']
    ],
    food: [
      items['FoodG12'],
      items['FoodG9'],
      items['PeanutG'],
      items['FoodMining1'],
      items['FoodEvent1'],
      items['Pearl2']
    ],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[20], count: 1 },
      { chip: chips[18], count: 1 },
      { chip: chips[17], count: 1 },
      { chip: chips[15], count: 1 },
      { chip: chips[16], count: 1 },
      { chip: chips[8], count: 1 }
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.wolfA,
      cards.w6b3,
      cards.CritterCard7,
      cards.Boss3C,
      cards.w6a3,
      cards.w5c2,
      cards.w4c4,
      cards.Boss4B
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Skilled_Dimwit')
    ],
    obols: [
      items.ObolEmp,
      items.ObolKruk,
      items.ObolSlush,
      items.ObolHyperB1,
      items.ObolGoldMining,
      items.ObolSilverMining,
      items.ObolHyper1
    ],
    starSigns: [
      { starSign: starSignByIndexMap[69], starSignIndex: 69, bonusIndex: 0 },
      { starSign: starSignByIndexMap[55], starSignIndex: 55, bonusIndex: 0 },
      { starSign: starSignByIndexMap[20], starSignIndex: 20, bonusIndex: 0 }
    ]
  },
  'catching': {
    name: 'Catching',
    equipment: [
      items['EquipmentHats119'],
      items['EquipmentBows14'],
      items['EquipmentShirts39'],
      items['EquipmentPendant30'],
      items['EquipmentPants31'],
      items['EquipmentRings35'],
      items['EquipmentShoes40'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain19'],
      items['Trophy23'],
      items['EquipmentKeychain19'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag19'],
      items['EquipmentGown4']
    ],
    tools: [
      items['CatchingNet12'],
      { rawName: 'Blank' },
      { rawName: 'Blank' },
      items['TrapBoxSet10'],
      items['WorshipSkull11']
    ],
    food: [
      items['FoodG12'],
      items['FoodG9'],
      items['FoodCatch1'],
      items['FoodEvent4']
    ],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[20], count: 1 },
      { chip: chips[18], count: 1 },
      { chip: chips[17], count: 1 },
      { chip: chips[15], count: 1 },
      { chip: chips[16], count: 1 },
      { chip: chips[8], count: 1 }
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.wolfA,
      cards.w6b3,
      cards.CritterCard7,
      cards.Boss3C,
      cards.w6a3,
      cards.w5c2,
      cards.w4c4,
      cards.Boss4B
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Skilled_Dimwit')
    ],
    obols: [
      items.ObolEmp,
      items.ObolKruk,
      items.ObolSlush,
      items.ObolHyperB1,
      items.ObolGoldCatching,
      items.ObolSilverCatching,
      items.ObolHyper1
    ],
    starSigns: [
      { starSign: starSignByIndexMap[69], starSignIndex: 69, bonusIndex: 0 },
      { starSign: starSignByIndexMap[55], starSignIndex: 55, bonusIndex: 0 },
      { starSign: starSignByIndexMap[7], starSignIndex: 7, bonusIndex: 0 }
    ]
  },
  'fishing': {
    name: 'Fishing',
    equipment: [
      items['EquipmentHats119'],
      items['EquipmentSword9'],
      items['EquipmentShirts5'],
      items['EquipmentPendant30'],
      items['EquipmentPants22'],
      items['EquipmentRings35'],
      items['EquipmentShoes28'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain19'],
      items['Trophy23'],
      items['EquipmentKeychain19'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag19'],
      items['EquipmentGown4']
    ],
    tools: [
      items['FishingRod12'],
      { rawName: 'Blank' },
      { rawName: 'Blank' },
      items['TrapBoxSet10'],
      items['WorshipSkull11']
    ],
    food: [
      items['FoodG12'],
      items['FoodG9'],
      items['FoodG7'],
      items['FoodFish1'],
      items['FoodEvent3'],
      items['Pearl1']
    ],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[20], count: 1 },
      { chip: chips[18], count: 1 },
      { chip: chips[17], count: 1 },
      { chip: chips[15], count: 1 },
      { chip: chips[16], count: 1 },
      { chip: chips[8], count: 1 }
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.wolfA,
      cards.w6b3,
      cards.CritterCard7,
      cards.Boss3C,
      cards.w6a3,
      cards.w5c2,
      cards.w4c4,
      cards.Boss4B
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Skilled_Dimwit')
    ],
    obols: [
      items.ObolEmp,
      items.ObolKruk,
      items.ObolSlush,
      items.ObolHyperB1,
      items.ObolGoldFishing,
      items.ObolSilverFishing,
      items.ObolHyper1
    ],
    starSigns: [
      { starSign: starSignByIndexMap[69], starSignIndex: 69, bonusIndex: 0 },
      { starSign: starSignByIndexMap[55], starSignIndex: 55, bonusIndex: 0 },
      { starSign: starSignByIndexMap[6], starSignIndex: 6, bonusIndex: 0 }
    ]
  },
  'trapping': {
    name: 'Trapping Eff',
    equipment: [
      items['EquipmentHats119'],
      items['EquipmentBows14'],
      items['EquipmentShirts39'],
      items['EquipmentPendant30'],
      items['EquipmentPants31'],
      items['EquipmentRings26'],
      items['EquipmentShoes40'],
      items['EquipmentRings26'],
      items['EquipmentHats82'],
      items['EquipmentKeychain18'],
      items['Trophy23'],
      items['EquipmentKeychain18'],
      items['EquipmentCape4'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag8'],
      items['EquipmentGown1']
    ],
    tools: [
      items['FoodG9']
    ],
    food: [],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[13], count: 3 },
      { chip: chips[15], count: 1 },
      { chip: chips[16], count: 1 },
      { chip: chips[11], count: 1 }
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.w6a3,
      cards.Boss3C,
      cards.w5c2,
      cards.w4c4,
      cards.w4b5,
      cards.bloque,
      cards.coconut,
      cards.Boss4B
    ],
    prayers: [
      getPrayer('Skilled_Dimwit')
    ],
    obols: [
      items.ObolEmp,
      items.ObolPinkTrapping,
      items.ObolSlush,
      items.ObolPlatinumTrapping,
      items.ObolGoldTrapping,
      items.ObolHyperB1,
      items.ObolHyper1,
      items.ObolSilverTrapping
    ],
    starSigns: [
      { starSign: starSignByIndexMap[44], starSignIndex: 44, bonusIndex: 0 },
      { starSign: starSignByIndexMap[38], starSignIndex: 38, bonusIndex: 0 },
      { starSign: starSignByIndexMap[34], starSignIndex: 34, bonusIndex: 0 }
    ]
  },
  'lab': {
    name: 'Lab',
    weaponByClass: {
      Beginner: 'EquipmentPunching11',
      Warrior: 'EquipmentSword9',
      Archer: 'EquipmentBows14',
      Mage: 'EquipmentWands13'
    },
    equipment: [
      items['EquipmentHats76'],
      items['EquipmentBows14'],
      items['EquipmentShirts39'],
      items['EquipmentPendant30'],
      items['EquipmentPants31'],
      items['EquipmentRings30'],
      items['EquipmentShoes33'],
      items['EquipmentRings30'],
      items['EquipmentHats69'],
      items['EquipmentKeychain19'],
      items['Trophy23'],
      items['EquipmentKeychain19'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag19'],
      items['EquipmentGown4']
    ],
    tools: [
      items['TrapBoxSet10'],
      items['WorshipSkull11']
    ],
    food: [
      items['FoodG12'],
      items['FoodG9']
    ],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[20], count: 1 },
      { chip: chips[18], count: 1 },
      { chip: chips[17], count: 1 },
      { chip: chips[15], count: 1 },
      { chip: chips[16], count: 1 },
      { chip: chips[8], count: 1 }
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.wolfA,
      cards.w6b3,
      cards.CritterCard7,
      cards.Boss3C,
      cards.w6a3,
      cards.w5c2,
      cards.w4c4,
      cards.Boss4B
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Skilled_Dimwit')
    ],
    obols: [
      items.ObolEmp,
      items.ObolKruk,
      items.ObolSlush,
      items.ObolHyperB1,
      items.ObolHyper1
    ],
    starSigns: [
      { starSign: starSignByIndexMap[69], starSignIndex: 69, bonusIndex: 0 },
      { starSign: starSignByIndexMap[55], starSignIndex: 55, bonusIndex: 0 },
      { starSign: starSignByIndexMap[20], starSignIndex: 20, bonusIndex: 0 }
    ]
  },
  'ladle': {
    name: 'Ladle',
    weaponByClass: {
      Beginner: 'EquipmentPunching11',
      Warrior: 'EquipmentSword9',
      Archer: 'EquipmentBows14',
      Mage: 'EquipmentWands13'
    },
    equipment: [
      items['EquipmentHats76'],
      items['EquipmentBows14'],
      items['EquipmentShirts39'],
      items['EquipmentPendant30'],
      items['EquipmentPants31'],
      items['EquipmentRings35'],
      items['EquipmentShoes31'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain19'],
      items['Trophy23'],
      items['EquipmentKeychain19'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag19'],
      items['EquipmentGown4']
    ],
    tools: [
      items['TrapBoxSet10'],
      items['WorshipSkull11']
    ],
    food: [
      items['FoodG12'],
      items['FoodG9']
    ],
    chips: [
      { chip: chips[21], count: 1 },
      { chip: chips[20], count: 1 },
      { chip: chips[18], count: 1 },
      { chip: chips[17], count: 1 },
      { chip: chips[15], count: 1 },
      { chip: chips[16], count: 1 },
      { chip: chips[8], count: 1 }
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.wolfA,
      cards.w6b3,
      cards.CritterCard7,
      cards.Boss3C,
      cards.w6a3,
      cards.w5c2,
      cards.w4c4,
      cards.Boss4B
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Skilled_Dimwit')
    ],
    obols: [
      items.ObolEmp,
      items.ObolKruk,
      items.ObolSlush,
      items.ObolHyperB1,
      items.ObolHyper1
    ],
    starSigns: [
      { starSign: starSignByIndexMap[69], starSignIndex: 69, bonusIndex: 0 },
      { starSign: starSignByIndexMap[55], starSignIndex: 55, bonusIndex: 0 },
      { starSign: starSignByIndexMap[20], starSignIndex: 20, bonusIndex: 0 }
    ]
  },
};