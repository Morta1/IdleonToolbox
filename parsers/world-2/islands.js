import { notateNumber, number2letter } from '../../utility/helpers';
import { getBribeBonus } from '../bribes';
import { isBundlePurchased } from '../misc';
import { getStampBonus } from '@parsers/stamps';
import { isArtifactAcquired } from '@parsers/sailing';

const shimmerIslandTrials = [
  'Get_as_much_total_stats_as_possible,_STR_AGI_WIS_and_LUK_combined.',
  'Get_as_much_STR_stat_as_you_can.',
  'Get_as_much_AGI_stat_as_you_can.',
  'Get_as_much_WIS_stat_as_you_can.',
  'Get_as_much_LUK_stat_as_you_can.',
  'Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_beginner',
  'Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_warrior.',
  'Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_archer.',
  'Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_mage.',
  'Get_the_highest_Accuracy_stat_you_can.',
  'Get_the_highest_Defence_stat._Tank_mains;_it\'s_your_moment!',
  'Get_the_highest_Movement_Speed_you_can.',
  'Get_the_highest_Critical_Chance_%_you_can.',
  'Spawn_as_many_Giant_Mobs_this_week_as_you_can.',
  'Get_the_highest_Max_HP_as_possible.',
  'Get_the_highest_Max_MP_as_possible.',
  'Get_as_many_individual_hits_on_the_DPS_Dummy_as_you_can_within_the_timer.',
  'Get_as_much_Mining_Efficiency_(number_of_digits)_as_you_can.',
  'Get_as_much_Choppin_Efficiency_(number_of_digits)_as_you_can.',
  'Get_as_much_Fishing_Efficiency_(number_of_digits)_as_you_can.',
  'Get_as_much_Catching_Efficiency_(number_of_digits)_as_you_can.',
  'Claim_as_much_Guild_GP_this_week_as_you_can.'
];

const shimmerIslandShop = [
  { effect: '+{,Base_STR', divider: 12 },
  { effect: '+{,Base_AGI', divider: 12 },
  { effect: '+{,Base_WIS', divider: 12 },
  { effect: '+{,Base_LUK', divider: 10 },
  { effect: '+{%,Total_DMG', divider: 3 },
  { effect: '+{%,Class_EXP', divider: 4 },
  { effect: '+{%,Skill_Eff', divider: 5 }
];

const fractalIslandBonuses = [
  { effect: '1_in_100000_chance_for_Trophy_per_hr_of_Nothing_AFK', cost: 24 },
  { effect: '1.25x_Dungeon_Credits_and_Flurbos_gained', cost: 200 },
  { effect: '-30%_Kitchen_Upgrade_Costs', cost: 750 },
  { effect: '1.20x_Chance_to_find_Sailing_Artifacts', cost: 2500 },
  { effect: 'Dirty_Shovel_digs_up_+25%_more_Gold_Nuggets', cost: 1e4 },
  { effect: '+100_Star_Talent_Pts', cost: 2e4 },
  { effect: 'All_Ninja_Twins_get_+2%_Stealth_per_Sneaking_LV', cost: 4e4 },
  { effect: 'World_7_Bonus..._I_wonder_what_it_will_be...', cost: 6e4 }
]

export const getIslands = (account, characters) => {
  const islandsKeys = (account?.accountOptions?.[169] || '')?.split('')
  const islandsUnlocked = account?.accountOptions?.[169]?.length;
  const preUnlockMultipliers = { 0: 0, 1: 8, 2: 32, 3: 80, 4: 200, 5: 500 };
  // 0 == this._DN3 ? this._DN2 = 0 : 1 == this._DN3 ?
  // this._DN2 = 15 : 2 == this._DN3 ? this._DN2 = 45
  // : 3 == this._DN3 ? this._DN2 = 100 : 4 == this._DN3
  // ? this._DN2 = 200 : 5 == this._DN3 && (this._DN2 = 500),
  const multipliers = { 0: 0, 1: 15, 2: 45, 3: 100, 4: 200, 5: 500 };
  const islands = [
    { name: 'Trash', description: 'Trade_garbage_that_washs_up_each_day_for_items', preUnlockCost: 4, baseCost: 10 },
    { name: 'Rando', description: 'Guaranteed_Random_Event_once_a_week', preUnlockCost: 12, baseCost: 12 },
    { name: 'Crystal', description: 'Fight_daily_giant_crystal_mobs_that_drop_candy', preUnlockCost: 20, baseCost: 15 },
    {
      name: 'Seasalt',
      description: 'Catch_legendary_fish_for_crafting_World_6_equips',
      preUnlockCost: 28,
      baseCost: 50
    },
    { name: 'Shimmer', description: 'Do_Weekly_Challenges_for_Shimmer_Upgrades', preUnlockCost: 40, baseCost: 25 },
    { name: 'Fractal', description: 'Dump_your_time_candy_here_for..._nothing...?', preUnlockCost: 52, baseCost: 70 }
  ].map((island, index) => ({
    ...island,
    unlocked: islandsKeys?.indexOf(number2letter?.[index]) !== -1,
    cost: islandsUnlocked === 0
      ? island.preUnlockCost + preUnlockMultipliers?.[islandsUnlocked]
      : island.baseCost + multipliers?.[islandsUnlocked],
    ...extraIslandDetails(account, characters, index)
  }))
  const bottles = account?.accountOptions?.[162];
  const bribeBonus = getBribeBonus(account?.bribes, 'Bottle_Service');
  const bundleBonus = isBundlePurchased(account?.bundles, 'bun_p') ? 30 : 0;
  const omarQuests = account?.quests?.['Yum-Yum_Desert']?.find(({ name }) => name === 'Omar_Da_Ogar')?.npcQuests?.reduce((sum, { completed }) => {
    return sum + (completed?.length > 0 ? 1 : 0)
  }, 0);
  const baseBottleValue = account?.accountOptions?.[164]; // not sure about the name
  const bottlesBonus = bribeBonus +
    (10 * baseBottleValue +
      10 * (omarQuests) + bundleBonus);
  const bottlesPerDay = Math.floor(4 * (1 + bottlesBonus / 100));

  const numberOfDaysAfk = account.accountOptions?.[160];
  const trashUpgradeLevel = account.accountOptions?.[163];
  let bonusPerDays;
  if (14 > numberOfDaysAfk) {
    bonusPerDays = .25 + numberOfDaysAfk
  } else {
    bonusPerDays = Math.pow(8 * numberOfDaysAfk, .5);
  }
  const trashPerDaysAfk = numberOfDaysAfk === 0
    ? 0
    : Math.round(3 * bonusPerDays * Math.floor(1.01 + (.5 + (Math.min(numberOfDaysAfk, 70) / 100 + trashUpgradeLevel / 5))))
  const trashPerDay = Math.round(3 * 1.25 * Math.floor(1.01 + (.5 + (Math.min(1, 70) / 100 + trashUpgradeLevel / 5))));
  const allShimmerBonus = Math.max(1, Math.min(4, 1 + 100 * (isArtifactAcquired(account?.sailing?.artifacts, 'The_Shim_Lantern')?.bonus ?? 0) / 100));

  return {
    islandsUnlocked,
    bottles,
    bottlesPerDay,
    trashPerDay,
    trashPerDaysAfk,
    numberOfDaysAfk,
    allShimmerBonus,
    list: islands
  }
}

const extraIslandDetails = (account, characters, index) => {
  let result = {};
  if (index === 0) {
    const trash = account?.accountOptions?.[161];
    const items = [
      {
        icon: 'data/StampB47',
        name: 'Skelefish Stamp',
        acquired: getStampBonus(account, 'skills', 'StampB47')
      },
      {
        icon: 'data/StampB32',
        name: 'Amplestample Stamp',
        acquired: getStampBonus(account, 'skills', 'StampB32')
      },
      {
        icon: 'data/StampA38',
        name: 'Golden Sixes Stamp',
        acquired: getStampBonus(account, 'combat', 'StampA38')
      },
      {
        icon: 'data/StampA39',
        name: 'Stat Wallstreet Stamp',
        acquired: getStampBonus(account, 'combat', 'StampA39')
      },
      {
        icon: 'etc/Trash_Currency',
        name: '+20% Garbage Gain',
        acquired: undefined
      },
      {
        icon: 'etc/Bribe',
        name: 'Unlock New Bribe Set',
        acquired: getBribeBonus(account?.bribes, 'The_Art_of_the_Bail')
      },
      {
        icon: 'data/Island1',
        name: '10% Message Bottle Gain',
        acquired: undefined
      },
      {
        icon: 'data/TalentBook1',
        name: 'Filthy Damage Special Talent Book',
        acquired: characters?.some(char =>
          char?.starTalents?.orderedTalents?.some(
            ({ maxLevel, name }) => name === 'FILTHY_DAMAGE' && maxLevel > 0
          )
        )
      },
      {
        icon: 'data/EquipmentNametag6b',
        name: 'Trash Tuna Nametag',
        acquired: account?.looty?.slabItems?.find(({
                                                     rawName,
                                                     obtained
                                                   }) => rawName === 'EquipmentNametag6b' && obtained)
      }
    ];
    const trashShopPrices = [20, 40, 80, 300, 7 * Math.pow(1.4, account?.accountOptions?.[163]), 135,
      25 * Math.pow(1.5, account?.accountOptions?.[164]), 450, 1500]?.map((cost, index) => {
      const upgrades = index === 4 ? account?.accountOptions?.[163] : index === 6
        ? account?.accountOptions?.[164]
        : null;
      return {
        cost: Math.round(cost),
        ...items?.[index],
        effect: items?.[index]?.icon,
        upgrades
      }
    });
    result = { trash, learnMore: true, shop: trashShopPrices }
  } else if (index === 1) {
    result = {
      learnMore: true, shop: [
        {
          effect: `5% Loot (${account?.accountOptions?.[166]})`,
          cost: Math.round(10 * Math.pow(1.5, account?.accountOptions?.[166]))
        },
        {
          effect: `3% Double boss (${account?.accountOptions?.[167]})`,
          cost: Math.round(6 * Math.pow(1.4, account?.accountOptions?.[167]))
        },
        {
          effect: `Star book`,
          cost: 200
        }
      ]
    };
  } else if (index === 4) {
    const shimmerTrialIndex = account?.accountOptions?.[183];
    const bestDpsEver = notateNumber(account?.accountOptions?.[172]);
    const shimmerCurrency = account?.accountOptions?.[173];
    const shimmerShop = shimmerIslandShop?.map(({ effect, divider }, index) => {
      const bonus = account?.accountOptions?.[174 + index]
      return {
        effect: effect?.replace('{', bonus)?.replace(',', ' '),
        bonus,
        cost: 1 + Math.floor(bonus / divider)
      }
    })
    result = {
      shop: shimmerShop,
      currentTrial: shimmerIslandTrials[shimmerTrialIndex],
      bestDpsEver,
      shimmerCurrency,
      learnMore: true
    };
  } else if (index === 5) {
    const hoursAfk = account?.accountOptions?.[184];
    result = {
      hoursAfk,
      shop: fractalIslandBonuses?.map((bonus) => ({ ...bonus, unlocked: hoursAfk >= bonus?.cost })),
      learnMore: true
    }
  }
  return result;
}

export const getIsland = (account, islandName) => {
  return account?.islands?.list?.find(({ name }) => name === islandName);
}

