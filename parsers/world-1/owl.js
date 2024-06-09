import { owlData } from '../../data/website-data';

export const getOwl = (idleonData, accountData) => {
  return parseOwl(accountData);
}

// Feaz0
const parseOwl = (account) => {
  const feathers = account?.accountOptions?.[253];
  const upgrades = owlData.map((upgrade, i) => {
    const commonFactor = (1 / (1 + (10 * account?.accountOptions?.[257]) / 100))
      * (1 / (1 + (20 * (account?.accountOptions?.[261])) / 100))
      * (1 / (1 + (getMegaFeather(account, 2) * (account?.accountOptions?.[254])) / 100))
      * (upgrade?.x1);

    const cost = 0 === i
      ? commonFactor
      * (account?.accountOptions?.[254 + i])
      * Math.pow(Math.max(1.05, (upgrade?.x2) - 0.025 * getMegaFeather(account, 8)), (account?.accountOptions?.[254 + i | 0]))
      : commonFactor
      * Math.pow((upgrade?.x2), (account?.accountOptions?.[254 + i]));
    const level = account?.accountOptions?.[254 + i]
    const nextLvReq = owlData?.[i + 1]?.x3;
    return {
      ...upgrade,
      cost,
      level,
      nextLvReq
    }
  });
  const featherRate = (1 + 9 * getMegaFeather(account, 0))
    * ((account?.accountOptions?.[254])
      + (5 * (account?.accountOptions?.[259])
        + (2 * getMegaFeather(account, 4)
          * (account?.accountOptions?.[257])
          + 4 * getMegaFeather(account, 4) * (account?.accountOptions?.[261]))))
    * (1 + (5 * (account?.accountOptions?.[256])) / 100) * Math.pow(3 + 2
      * getMegaFeather(account, 6), (account?.accountOptions?.[258]))
    * (1 + ((account?.accountOptions?.[264]) * (account?.accountOptions?.[260])) / 100);
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
    }
  ]

  return {
    upgrades,
    bonuses,
    feathers,
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