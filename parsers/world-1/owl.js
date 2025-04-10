import { owlData } from '../../data/website-data';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';

export const getOwl = (idleonData, accountData) => {
  return parseOwl(accountData);
}

const megaFeathersDesc = [
  'Multiplies_all_Feather_generation_by_10x._Multiplicative,_so_extra_powerful!',
  'Boosts_all_of_Orion\'s_Bonuses_by_double_their_base_amount.',
  'All_upgrades_cost_1%_less_feathers_per_LV_of_Feather_Generation.',
  'Instead_of_double,_all_of_Orion\'s_Bonuses_are_now_triple.',
  'The_Feather_Cheapener_upgrades_now_give_+2_and_+4_Feathers/sec_each_LV,_respectively.',
  'Forget_triple,_Orion\'s_Bonuses_are_now_quadruple!',
  'The_upgrade_Feather_Restart_now_gives_a_5x_feather_bonus_instead_of_the_previous_3x.',
  'Quadruple?_Pfft_more_like_Noobruple,_Orion\'s_Bonuses_are_now_Quintuple_at_big,_that\'s_5x!',
  'The_cost_of_Feather_Generation_upgrade_now_goes_up_25%_slower.',
  'Orion\'s_bonuses_are_now_{x_higher_than_they_were_at_first.'
]

const parseOwl = (account) => {
  const feathers = account?.accountOptions?.[253];
  const progress = account?.accountOptions?.[263];
  const upgrades = owlData.map((upgrade, i) => {
    const commonFactor = (1 / (1 + (10 * account?.accountOptions?.[257]) / 100))
      * (1 / (1 + (20 * (account?.accountOptions?.[261])) / 100))
      * (1 / (1 + (getMegaFeather(account, 2) * (account?.accountOptions?.[254])) / 100))
      * (upgrade?.x1);

    const cost = 0 === i
      ? commonFactor
      * (account?.accountOptions?.[254 + i])
      * Math.pow(Math.max(1.05, (upgrade?.x2) - 0.025 * getMegaFeather(account, 8)), (account?.accountOptions?.[254 + i]))
      : commonFactor
      * Math.pow((upgrade?.x2), (account?.accountOptions?.[254 + i]));

    let description = upgrade?.desc;

    const megaFeather6 = getMegaFeather(account, 6) || 0;
    const option258 = account.accountOptions[258] || 0;
    const bonus1 = Math.pow(Math.round(3 + 2 * megaFeather6), option258 + 1);

    const option254PlusI = account.accountOptions[254 + i] || 0;
    const multiplier = parseInt('1 0 5 10 0 5 1 20 0'.split(' ')[i]) || 0;
    const bonus2 = multiplier * option254PlusI;
    const bonus3 = Math.floor(1e4 * (1 - 1 / (1 + 10 * option254PlusI / 100))) / 100;

    description = description
      .replace('{', '' + bonus1)
      .replace('}', '' + bonus2)
      .replace('@', '' + bonus3);


    if (i === 0 && getMegaFeather(account, 2) === 1) {
      const option254 = account.accountOptions[254] || 0;
      const costReductionBonus = Math.floor(
        1e4 * (1 - 1 / (1 + getMegaFeather(account, 2) * option254 / 100))
      ) / 100;
      description += ', and lowers all costs by ' + costReductionBonus + '%';
    }

    const level = account?.accountOptions?.[254 + i]
    const nextLvReq = owlData?.[i + 1]?.x3;
    return {
      ...upgrade,
      desc: description,
      cost,
      level,
      nextLvReq,
      unlocked: progress > upgrade?.x3
    }
  });
  const nextLvReqIndex = upgrades?.findIndex(({ level, x3 }) => progress < x3);
  const nextLvReq = owlData?.[nextLvReqIndex]?.x3 || 0;
  const vaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 21);

  const featherRate = (1 + 9 * getMegaFeather(account, 0))
    * (1 + vaultUpgradeBonus / 100)
    * (1 + getGambitBonus(account, 8) / 100)
    * ((account?.accountOptions?.[254])
      + (5 * (account?.accountOptions?.[259])
        + (2 * getMegaFeather(account, 4)
          * (account?.accountOptions?.[257])
          + 4 * getMegaFeather(account, 4) * (account?.accountOptions?.[261]))))
    * (1 + (5 * (account?.accountOptions?.[256])) / 100) * Math.pow(3 + 2
      * getMegaFeather(account, 6), (account?.accountOptions?.[258]))
    * (1 + ((account?.accountOptions?.[264]) * (account?.accountOptions?.[260])) / 100)
    + account?.accountOptions?.[264];
  const totalFeatherBonus = 100 * getMegaFeather(account, 1)
    + (100 * getMegaFeather(account, 3)
      + (100 * getMegaFeather(account, 5)
        + (100 * getMegaFeather(account, 7)
          + (100 * Math.min(1, getMegaFeather(account, 9))
            + 50 * Math.max(0, getMegaFeather(account, 9) - 1)))));

  const bonuses = [
    { name: 'Feather/sec', bonus: featherRate },
    {
      name: 'Class XP',
      bonus: 5 * (1 + totalFeatherBonus / 100) * Math.max(0, Math.ceil(account?.accountOptions?.[255] / 6)),
      percentage: true
    },
    {
      name: 'Base DMG',
      bonus: 10 * (1 + totalFeatherBonus / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[255] - 1) / 6))
    },
    {
      name: 'Total DMG',
      bonus: 2 * (1 + totalFeatherBonus / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[255] - 2) / 6)),
      percentage: true
    },
    {
      name: 'Skill XP',
      bonus: 4 * (1 + totalFeatherBonus / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[255] - 3) / 6)),
      percentage: true
    },
    {
      name: 'Drop Rate',
      bonus: (1 + totalFeatherBonus / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[255] - 4) / 6)),
      percentage: true
    },
    {
      name: 'All Stats',
      bonus: 2 * (1 + totalFeatherBonus / 100) * Math.max(0, Math.ceil((account?.accountOptions?.[255] - 5) / 6))
    },
    {
      name: 'Shiny Feather',
      bonus: account?.accountOptions?.[264]
    }
  ];
  const megaFeathers = megaFeathersDesc.map((description, index) => ({
    description,
    unlocked: index + 1 <= account?.accountOptions?.[262],
    ...(index === 9 ? {
      amount: account?.accountOptions?.[262] - 10,
      totalBonus: 1 + totalFeatherBonus / 100
    } : {})
  }));
  return {
    upgrades,
    bonuses,
    feathers,
    progress,
    nextLvReq,
    megaFeathers,
    featherRate,
    restartMulti: Math.pow(3 + 2
      * getMegaFeather(account, 6), (account?.accountOptions?.[258] + 1))
  }
}

const getMegaFeather = (account, i) => {
  return (account?.accountOptions?.[262]) > i ? (9 === i
    ? (account?.accountOptions?.[262]) - 9
    : 1) : 0;
}

export const getOwlBonus = (bonuses, bonusName) => {
  return bonuses?.find(({ name }) => name === bonusName)?.bonus;
}