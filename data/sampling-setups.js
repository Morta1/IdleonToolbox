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
      items['EquipmentHats106'],
      items['EquipmentBows12'],
      items['EquipmentShirts36'],
      items['EquipmentPendant30'],
      items['EquipmentPants27'],
      items['EquipmentRings35'],
      items['EquipmentShoes38'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain22'],
      items['Trophy18'],
      items['EquipmentKeychain22'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag17'],
      items['EquipmentGown2']
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
      items['FoodPotGr2'],
      items['FoodPotGr3'],
      items['FoodPotGr4']
    ],
    chips: [
      chips[21],
      chips[20],
      chips[18],
      chips[17],
      chips[15],
      chips[10]
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
      items['EquipmentHats105'],
      items['EquipmentWands13'],
      items['EquipmentShirts37'],
      items['EquipmentPendant30'],
      items['EquipmentPants29'],
      items['EquipmentRings35'],
      items['EquipmentShoes27'],
      items['EquipmentRings35'],
      items['EquipmentHats69'],
      items['EquipmentKeychain19'],
      items['Trophy16'],
      items['EquipmentKeychain19'],
      items['EquipmentCape16'],
      items['EquipmentRingsChat11'],
      items['EquipmentNametag17'],
      items['EquipmentGown2']
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
      items['FoodEvent2'],
    ],
    chips: [
      chips[21],
      chips[20],
      chips[18],
      chips[17],
      chips[15],
      chips[16],
      chips[8]
    ],
    cardSet: cardSets['{%_Skill_Efficiency'],
    cards: [
      cards.wolfA,
      cards.w6b3,
      cards.CritterCard7,
      cards.Boss3C,
      cards.w6a3,
      cards.w5c2,
      cards.w6a5,
      cards.w4c4
    ],
    prayers: [
      getPrayer('Zerg_Rushogen'),
      getPrayer('Midas_Minded'),
    ],
    obols: [
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
    equipment: [],
    tools: [],
    food: [],
    chips: [],
    cardSet: {},
    cards: [],
    prayers: [],
    obols: [],
    starSigns: []
  },
  'catching': {
    name: 'Catching',
    equipment: [],
    tools: [],
    food: [],
    chips: [],
    cardSet: {},
    cards: [],
    prayers: [],
    obols: [],
    starSigns: []
  },
  'fishing': {
    name: 'Fishing',
    equipment: [],
    tools: [],
    food: [],
    chips: [],
    cardSet: {},
    cards: [],
    prayers: [],
    obols: [],
    starSigns: []
  },
  'trapping': {
    name: 'Trapping',
    equipment: [],
    tools: [],
    food: [],
    chips: [],
    cardSet: {},
    cards: [],
    prayers: [],
    obols: [],
    starSigns: []
  }
};