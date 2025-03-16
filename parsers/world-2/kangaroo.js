import { poppyBonuses, poppyTarBonuses } from '../../data/website-data';
import { commaNotation, notateNumber } from '@utility/helpers';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';

export const getKangaroo = (idleonData, accountData) => {
  return parseKangaroo(accountData);
}

const megaFishDesc = [
  'Unlocks_the_first_3_upgrades_in_the_Tar_Pit,_visit_through_top_left_corner',
  'Boosts_all_of_Poppy\'s_Bonuses_by_1.5x_their_base_amount',
  'Adds_two_more_Reset_Spirals_to_upgrade,_and_gives_+5_Pts_when_Fisheroo_Resetting',
  'Boosts_all_of_Poppy\'s_Bonuses_by_2x_their_base_amount.',
  'Unlocks_another_3_upgrades_in_the_Tar_Pit,_and_boosts_Tartar_Fish_gain_by_3x',
  'The_Fishing_Buddy_upgrade_now_gives_+50%_Bluefin_caught_and_+50%_Shiny_Speed_per_Lv_past_Lv.5!',
  'Boosts_all_of_Poppy\'s_Bonuses_by_2.5x_their_base_amount',
  'Unlocks_the_final_2_upgrades_in_the_Tar_Pit,_and_boosts_Tartar_Fish_gain_by_another_3x',
  'Boosts_all_of_Poppy\'s_Bonuses_by_3x_their_base_amount',
  'Shiny_fishing_is_1%_faster_per_upgrade_LV_of_the_Tasty_Fishbait_upgrade',
  'All_upgrades,_including_Tar_Pit_upgrades,_are_5%_cheaper_per_LV_of_King_Worm_upgrade',
  'Poppy\'s_bonuses_are_now_{x_higher_than_they_were_at_first'
];

const resetBonusesDesc = [
  '{x_bluefin_fish_caught',
  '{x_shiny_fishing_speed_and_luck',
  'All_upgrades_are_{x_cheaper',
  'Other_Reset_bonuses_are_{x_higher',
  '{x_Tartar_fish_caught'
];

const parseKangaroo = (account) => {
  const fish = account?.accountOptions?.[267];
  const progress = account?.accountOptions?.[280];
  const upgrades = poppyBonuses.map((upgrade, i) => {
    const base = i === 0 ? 1 + account?.accountOptions?.[268] : 1;
    const commonFactor = base
      * (1 / (1 + (10 * account?.accountOptions?.[272]) / 100))
      * (1 / (1 + (15 * account?.accountOptions?.[300]) / 100))
      * (1 / (1 + (5 * getMegaFish(account, 10)
        * account?.accountOptions?.[304]) / 100));

    const cost = commonFactor
      * (1 / Math.max(1, getResetBonuses(account, 2)))
      * upgrade?.x1
      * Math.pow(upgrade?.x2, account?.accountOptions?.[268 + i])

    const level = account?.accountOptions?.[268 + i]
    const nextLvReq = poppyBonuses?.[i + 1]?.x3;
    const newDesc = formatDescription(account, level, upgrade?.desc, 0, i, poppyBonuses);

    return {
      ...upgrade,
      cost,
      level,
      nextLvReq,
      desc: newDesc,
      unlocked: progress > upgrade?.x3 || i === 0
    }
  });
  const nextLvReqIndex = upgrades?.findIndex(({ level, x3 }) => progress < x3);
  const nextLvReq = poppyBonuses?.[nextLvReqIndex]?.x3;
  const vaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 45);
  const baseFishRate = (1 + Math.min(5, account?.accountOptions?.[275]))
    * Math.max(1, 1 + 0.5 * (account?.accountOptions?.[275] - 5)
      * getMegaFish(account, 5)) * getResetBonuses(account, 0)
    * (1 + vaultUpgradeBonus / 100)
    * (1 + getGambitBonus(account, 8) / 100)
    * (10 * account?.accountOptions?.[268] + (100 * account?.accountOptions?.[297] +
      1e3 * account?.accountOptions?.[304]) + (50 * account?.accountOptions?.[273]
      + 200 * account?.accountOptions?.[278])) * getShinyMulti(account, -1)
    * (1 + (8 * account?.accountOptions?.[299]) / 100);
  const catchReq = 30 / (1 + (5 * account?.accountOptions?.[269]) / 100)
  const fishRate = baseFishRate * (60 / catchReq)

  // TAR
  const tarFishUnlocked = Math.min(8, Math.round(3 * getMegaFish(account, 0)
    + (3 * getMegaFish(account, 4) + 2 * getMegaFish(account, 7))));
  const tarFishOwned = account?.accountOptions?.[296];
  const tarFishRate = (1 / (1 + 0.05 *
      account?.accountOptions?.[301]))
    * 1800 * (1 / Math.max(1, getResetBonuses(account, 4)))
    * (1 / (1 + 2 * getMegaFish(account, 4)))
    * (1 / (1 + 2 * getMegaFish(account, 7)));

  const tarUpgrades = poppyTarBonuses.map((tarUpgrade, i) => {
    const base = (1 / (1 + (5 * getMegaFish(account, 10) * account?.accountOptions?.[304]) / 100));
    const cost = account?.accountOptions?.[297 + i]
      + base * tarUpgrade?.x1
      * Math.pow(tarUpgrade?.x2, account?.accountOptions?.[297 + i]);

    const level = account?.accountOptions?.[297 + i];
    const newDesc = formatDescription(account, level, tarUpgrade?.desc, 1, i, poppyTarBonuses);

    return {
      ...tarUpgrade,
      cost,
      level,
      desc: newDesc,
      unlocked: i < tarFishUnlocked
    }
  });

  const baseShinyRate = getResetBonuses(account, 1)
    * account?.accountOptions?.[270] * (1 + (getMegaFish(account, 9) * account?.accountOptions?.[268]) / 100)
    * Math.max(1, 1 + 0.5 * (account?.accountOptions?.[275] - 5) * getMegaFish(account, 5));
  const shinyRate = .05 * baseShinyRate * 1200;
  const shinyReq = 7200 / (1 + (4 * account?.accountOptions?.[276]) / 100);
  const shinyRatePercent =  100 * Math.max(0, shinyRate / shinyReq)
  const shinyProgress = 100 * Math.max(0, account?.accountOptions?.[289] / shinyReq);

  const totalFishRate = 50 * getMegaFish(account, 1)
    + (50 * getMegaFish(account, 3)
      + (50 * getMegaFish(account, 6)
        + (50 * getMegaFish(account, 8)
          + (50 * Math.min(1, getMegaFish(account, 11))
            + 25 * Math.max(0, getMegaFish(account, 11) - 1)))));

  const bonuses = [
    { name: 'Fish/minute', bonus: fishRate },
    {
      name: 'Fishing Eff',
      bonus: 3 * (1 + totalFishRate / 100) * Math.max(0, Math.ceil(account?.accountOptions?.[271] / 7)),
      percentage: true
    },
    {
      name: 'Defence',
      bonus: 3 * (1 + totalFishRate / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[271] - 1) / 7)),
      percentage: false
    },
    {
      name: 'Fishing XP',
      bonus: 5 * (1 + totalFishRate / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[271] - 2) / 7)),
      percentage: true
    },
    {
      name: 'Accuracy',
      bonus: 2 * (1 + totalFishRate / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[271] - 3) / 7)),
      percentage: true
    },
    {
      name: 'Total DMG',
      bonus: 2 * (1 + totalFishRate / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[271] - 4) / 7)),
      percentage: true
    },
    {
      name: 'AFK Gains',
      bonus: 0.5 * (1 + totalFishRate / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[271] - 5) / 7)),
      percentage: true
    },
    {
      name: 'Cash',
      bonus: 3 * (1 + totalFishRate / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[271] - 6) / 7)),
      percentage: true
    }
  ];
  const megaFish = megaFishDesc.map((description, index) => ({
    description,
    unlocked: index + 1 <= account?.accountOptions?.[279],
    ...(index === 11 ? {
      amount: account?.accountOptions?.[279] - 12,
      totalBonus: 1 + totalFishRate / 100
    } : {})
  }));
  const resetBonuses = resetBonusesDesc.map((desc, i) => ({
    desc: desc.replace('{', Math.round(100 * getResetBonuses(account, i)) / 100),
    level: account?.accountOptions?.[291 + i]
  }));
  let totalMulti = getShinyMulti(account, -1);
  if (1E3 > getShinyMulti(account, -1)) {
    totalMulti = notateNumber(totalMulti, 'MultiplierInfo');
  } else if (1E7 > getShinyMulti(account, -1)) {
    totalMulti = commaNotation(totalMulti);
  } else {
    totalMulti = notateNumber(totalMulti, 'MultiplierInfo');
  }
  const allMultipliers = [0, 1, 2, 3, 4, 5].map((index) => {
    let amount = account?.accountOptions?.[281 + index];
    const baseMulti = getShinyMulti(account, index);
    const multi = (10 > baseMulti ? notateNumber(baseMulti, 'MultiplierInfo') : 100 > baseMulti
      ? '' + Math.floor(10 * baseMulti) / 10
      : '' + Math.floor(baseMulti)).replace('.00', '');
    return {
      multi,
      amount: 1E4 > amount ? '' + Math.round(amount) : '' + notateNumber(amount, 'Big')
    }
  });

  return {
    resetBonuses,
    upgrades,
    bonuses,
    fish,
    progress,
    nextLvReq,
    megaFish,
    fishRate,
    tarFishRate,
    tarFishOwned,
    totalMulti,
    allMultipliers,
    tarUpgrades,
    shinyProgress,
    shinyRate,
    shinyRatePercent
  }
}

const formatDescription = (account, level, desc, upgradesIndex, i, data) => {
  const index = Math.round(268 + 29 * upgradesIndex + i);
  let newDesc = desc;
  newDesc = newDesc.replace('{', '' + commaNotation(((account?.accountOptions?.[index]) * (data[i]?.x6))));
  newDesc = newDesc.replace(']', '' + Math.round(100 + (level * (data[i]?.x6))) / 100);
  newDesc = newDesc.replace('~', '' + notateNumber(100 * (1 - 1 / (1 + level * (data[i]?.x6) / 100)), 'Small'));
  newDesc = newDesc.replace('?', '' + notateNumber((data[i]?.x6) * (level / (40 + level)), 'Small'));
  return newDesc;
}

const getMegaFish = (account, i) => {
  return (account?.accountOptions?.[279]) > i ? (11 === i
    ? (account?.accountOptions?.[279]) - 11
    : 1) : 0;
}

const getShinyMulti = (account, i) => {
  let base = 1;
  if (i < 0) {
    base *= getShinyMulti(account, 0);
    base *= getShinyMulti(account, 1);
    base *= getShinyMulti(account, 2);
    base *= getShinyMulti(account, 3);
    base *= getShinyMulti(account, 4);
    base *= getShinyMulti(account, 5);
    return base;
  } else {
    if (i === 0) base = 30;
    if (i === 1) base = 50;
    if (i === 2) base = 100;
    if (i === 3) base = 150;
    if (i === 4) base = 250;
    if (i === 5) base = 500;
  }
  return 1 + (base * Math.log(Math.max(1, account?.accountOptions?.[Math.round(281 + i)]))) / 100;
}

const getResetBonuses = (account, i) => {
  const base = 0 === i
    ? (1 + 0.4 * account?.accountOptions?.[291])
    : 1 === i
      ? (1 + 0.3 * account?.accountOptions?.[292])
      : 2 === i
        ? (1 + 0.15 * account?.accountOptions?.[293])
        : 3 === i
          ? (1 + 0.04 * account?.accountOptions?.[294])
          : (1 + 0.2 * account?.accountOptions?.[295]);
  const secondBase = i !== 3 && 0 < account?.accountOptions?.[291 + i] ? 1 + .04 * account?.accountOptions?.[294] : 1;
  return base * secondBase;
}
export const getKangarooBonus = (bonuses, bonusName) => {
  return bonuses?.find(({ name }) => name === bonusName)?.bonus;
}