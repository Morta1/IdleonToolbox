import { emperorBonuses } from '../../data/website-data';
import { commaNotation, notateNumber } from '@utility/helpers';
import { getJadeEmporiumBonus } from '@parsers/world-6/sneaking';


const icons = {
  0: 'data/ClassIcons58',
  1: 'data/Bone0_x1',
  2: 'data/ClassIcons57',
  3: 'data/Opal',
  4: 'data/ClassIcons29',
  5: 'data/Quest78',
  6: '',
  7: 'data/ClassIcons56',
  8: 'data/ClassIcons59',
  9: '',
  10: '',
  11: 'etc/Owlb_5'
};

export const getEmperor = (idleonData, account) => {
  const highestEmperorShowdown = account?.accountOptions?.[369];
  let bonuses = emperorBonuses.filter((val, index, self) =>
    self.findIndex((t) => t.name === val.name) === index);
  const totalBonuses = emperorBonuses.reduce((result, bonus, index) => {
    if (!result[bonus.name]) {
      result[bonus.name] = 0;
    }
    if (index < highestEmperorShowdown) {
      result[bonus.name] += bonus?.value ?? 0;
      return result;
    } else {
      return result;
    }
  }, {});
  bonuses = bonuses.map((rawBonus) => {
    const totalBonus = totalBonuses[rawBonus.name] ?? 0;
    const bonus = rawBonus.name.replace('{', commaNotation(totalBonus))
      .replace('}', notateNumber(1 + totalBonus / 100, 'MultiplierInfo'))
      .replace('$', Math.floor((totalBonus + 4) / (totalBonus + 100) * 1000) / 10);
    const value = `${rawBonus.name.substring(0, 3)}`.replace('{', commaNotation(rawBonus.value))
      .replace('}', rawBonus.value / 100)
      .replace('$', Math.floor((rawBonus.value + 4) / (rawBonus.value + 100) * 1000) / 10)
    return {
      bonus,
      totalBonus,
      rawIndex: rawBonus.index,
      icon: icons[rawBonus.index],
      value,
      indexes: emperorBonuses.reduce((acc, bonus, idx) => {
        if (bonus.index === rawBonus.index) acc.push(idx);
        return acc;
      }, [])
    }
  });
  const nextLevelBonus = emperorBonuses.find((val, index) => index === highestEmperorShowdown + 1);
  const jadeEmporiumBonus = getJadeEmporiumBonus(account, 'Emperor_Season_Pass') ?? 0;
  const maxAttempts = Math.round(5 * jadeEmporiumBonus + 6 * account?.accountOptions?.[382] + 5) + 1
  return {
    highestEmperorShowdown,
    bossHp: Array.from({ length: 6 }, (_, index) => getBossHp(highestEmperorShowdown + index)),
    bonuses,
    nextLevelBonus,
    dailyAttempts: Math.round(1 + account?.accountOptions?.[382]),
    attempts: Math.round(-1 * (account?.accountOptions?.[370] - 1)),
    maxAttempts
  }
}

const getBossHp = (highestEmperorShowdown) => {
  return 135e13 * Math.pow(1.7, highestEmperorShowdown);
}

export const getEmperorBonus = (account, index) => {
  return account?.emperor?.bonuses?.find(({ rawIndex }) => rawIndex === index)?.totalBonus ?? 0;
}