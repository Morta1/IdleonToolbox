import { emperorBonuses } from '../../data/website-data';
import { commaNotation, notateNumber } from '@utility/helpers';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getTesseractBonus } from '@parsers/tesseract';
import { getArcadeBonus } from '@parsers/arcade';


const icons = {
  0: 'data/ClassIcons58',
  1: 'data/Bone0_x1',
  2: 'data/ClassIcons57',
  3: 'data/Opal',
  4: 'data/ClassIcons29',
  5: 'data/Quest78',
  6: 'data/Tach0_x1',
  7: 'data/ClassIcons56',
  8: 'data/ClassIcons59',
  9: '',
  10: '',
  11: 'etc/Owlb_5'
};

export const getEmperor = (idleonData, account) => {
  const highestEmperorShowdown = account?.accountOptions?.[369] ?? 0;
  const cycle = Math.floor(highestEmperorShowdown / 48);
  let bonuses = emperorBonuses.filter(
    (val, idx, self) =>
      self.findIndex(t => t.name === val.name && t.index === val.index) === idx
  );
  const totalBonuses = emperorBonuses.reduce((result, bonus, index) => {
    if (!result[bonus.name]) {
      result[bonus.name] = 0;
    }
    if (index < highestEmperorShowdown) {
      const cycles = Math.floor(highestEmperorShowdown / 48);
      const effectiveIndex = highestEmperorShowdown % 48;
      result[bonus.name] += (bonus?.value ?? 0) * cycles;
      if (index < effectiveIndex) {
        result[bonus.name] += bonus?.value ?? 0;
      }
      return result;
    } else {
      return result;
    }
  }, {});
  bonuses = bonuses.map((rawBonus) => {
    const tesseractBonus = getTesseractBonus(account, 48)
    const totalBonus = totalBonuses[rawBonus.name] ?? 0;
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Emperor_Bonuses')?.bonus;
    const bonus = rawBonus.name.replace('{', commaNotation(totalBonus))
      .replace('}', notateNumber(1 + totalBonus / 100, 'MultiplierInfo'))
      .replace('$', Math.floor((totalBonus + 4) / (totalBonus + 100) * 1000) / 10);
    const value = `${rawBonus.name.substring(0, 3)}`.replace('{', commaNotation(rawBonus.value))
      .replace('}', rawBonus.value / 100)
      .replace('$', Math.floor((rawBonus.value + 4) / (rawBonus.value + 100) * 1000) / 10)
    return {
      bonus,
      totalBonus: Math.floor(totalBonus * (1 + (tesseractBonus + arcadeBonus) / 100)),
      rawIndex: rawBonus.index,
      icon: icons[rawBonus.index],
      value,
      indexes: getNextIndexes(rawBonus, cycle)
    }
  });
  const nextLevelBonus = emperorBonuses.find((val, index) => index === highestEmperorShowdown + 1);
  const jadeEmporiumBonus = isJadeBonusUnlocked(account, 'Emperor_Season_Pass') ? 1 : 0;
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

const getNextIndexes = (rawBonus, cycle) => {
  const currentIndexes = emperorBonuses.reduce((acc, bonus, idx) => {
    if (bonus.index === rawBonus.index) acc.push(idx + (cycle * 48));
    return acc;
  }, []);

  // If we have less than 5 elements, find future occurrences
  if (currentIndexes.length < 5) {
    let futureCycle = cycle + 1;
    let futureIdx = 0;

    while (currentIndexes.length < 5 && futureIdx < emperorBonuses.length) {
      if (emperorBonuses[futureIdx].index === rawBonus.index) {
        currentIndexes.push(futureIdx + (futureCycle * 48));
      }
      futureIdx++;
      if (futureIdx === emperorBonuses.length) {
        futureIdx = 0;
        futureCycle++;
      }
    }
  }

  return currentIndexes;
}

const getBossHp = (highestEmperorShowdown) => {
  return 135e13 * Math.pow(1.7, highestEmperorShowdown);
}

export const getEmperorBonus = (account, index) => {
  return account?.emperor?.bonuses?.find(({ rawIndex }) => rawIndex === index)?.totalBonus ?? 0;
}