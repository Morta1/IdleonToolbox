import { emperorBonuses, gameTables } from '@website-data';
import { commaNotation, notateNumber } from '@utility/helpers';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { createBreakdown, percent } from '@parsers/breakdown';


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

// game: "EmperorBon" - every bonus's total; getEmperorBonus reads them back.
export const getEmperor = (idleonData: any, account: any) => {
  const highestEmperorShowdown = account?.accountOptions?.[369] ?? 0;
  const cycle = Math.floor(highestEmperorShowdown / 48);
  let bonuses: any[] = emperorBonuses.filter(
    (val, idx, self) =>
      self.findIndex(t => t.name === val.name && t.index === val.index) === idx
  );
  // weight per unlock: the bonus value gives the totals, 1 gives how many times each bonus was unlocked
  const sumUnlocked = (weight: (bonus: any) => number) => emperorBonuses.reduce((result: Record<string, any>, bonus, index) => {
    const key = `${bonus.name}|${bonus.index}`;
    if (!result[key]) {
      result[key] = 0;
    }
    if (index < highestEmperorShowdown) {
      const cycles = Math.floor(highestEmperorShowdown / 48);
      const effectiveIndex = highestEmperorShowdown % 48;
      result[key] += weight(bonus) * cycles;
      if (index < effectiveIndex) {
        result[key] += weight(bonus);
      }
      return result;
    } else {
      return result;
    }
  }, {} as Record<string, any>);
  const totalBonuses = sumUnlocked((bonus) => bonus?.value ?? 0);
  const unlockCounts = sumUnlocked(() => 1);
  const tesseractBonus = getTesseractBonus(account, 48) ?? 0;
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Emperor_Bonuses')?.bonus ?? 0;
  const jellyBonus = getJellyBonus(account, 28);
  const multiTotal = 1 + (tesseractBonus + arcadeBonus + jellyBonus) / 100;
  const formatBonusName = (name: string, total: number) => name
    .replace('{', '' + commaNotation(total))
    .replace('}', '' + notateNumber(1 + total / 100, 'MultiplierInfo'))
    .replace('$', '' + Math.floor((total + 4) / (total + 100) * 1000) / 10);
  bonuses = bonuses.map((rawBonus) => {
    const baseTotal = totalBonuses[`${rawBonus.name}|${rawBonus.index}`] ?? 0;
    const realTotal = Math.floor(baseTotal * multiTotal);
    const bonus = formatBonusName(rawBonus.name, realTotal);
    const baseBonus = formatBonusName(rawBonus.name, baseTotal);
    const value = formatPerLevelBonus(rawBonus.name.substring(0, 3), rawBonus.value);
    return {
      bonus,
      baseBonus,
      totalBonus: realTotal,
      // showdown levels that unlocked this bonus (the page's "Per level" steps)
      levels: unlockCounts[`${rawBonus.name}|${rawBonus.index}`] ?? 0,
      rawIndex: rawBonus.index,
      rawName: rawBonus.name,
      icon: (icons as Record<number, string>)[rawBonus.index],
      value,
      indexes: getNextIndexes(rawBonus, cycle)
    }
  });
  const bonusMulti = createBreakdown('Bonus Multi', multiTotal, [
    percent('Arcade Shop', arcadeBonus),
    percent('Tesseract (Vicar of the Emperor)', tesseractBonus),
    percent('Jelly Operator', jellyBonus)
  ], { combine: 'additive' });
  // Beating level L unlocks emperorBonuses[(L - 1) % 48], so the next one is at highestEmperorShowdown.
  const upcomingBonuses = Array.from({ length: UPCOMING_BONUSES }, (_, offset) => {
    const rawBonus = emperorBonuses[(highestEmperorShowdown + offset) % emperorBonuses.length];
    return {
      level: highestEmperorShowdown + offset + 1,
      bonus: formatPerLevelBonus(rawBonus.name, rawBonus.value),
      rawIndex: rawBonus.index,
      icon: (icons as Record<number, string>)[rawBonus.index]
    };
  });
  const jadeEmporiumBonus = isJadeBonusUnlocked(account, 'Emperor_Season_Pass') ? 1 : 0;
  const dailyAttemptsOption = account?.accountOptions?.[382] ?? 0;
  const attemptsUsed = account?.accountOptions?.[370] ?? 0;
  // game: "Thingies:MaxEmperorAttemptStack"; the panel prints it + 1 as the cap
  const maxStack = Math.round(5 * jadeEmporiumBonus + 6 * dailyAttemptsOption + 5);
  const maxAttempts = maxStack + 1
  const dailyAttempts = Math.round(1 + dailyAttemptsOption);
  // The daily refill is skipped whole when attempts + daily would pass maxStack (the printed cap is
  // never reached), and the Jade 50% +1 roll needs one more free slot. This is the first count where
  // the next refill loses something.
  const noWasteAttempts = maxStack - dailyAttempts - jadeEmporiumBonus + 1;
  return {
    highestEmperorShowdown,
    bossHp: Array.from({ length: 6 }, (_, index) => getBossHp(highestEmperorShowdown + index)),
    bonuses,
    bonusMulti,
    upcomingBonuses,
    dailyAttempts,
    attempts: Math.round(-1 * (attemptsUsed - 1)),
    maxAttempts,
    noWasteAttempts
  }
}

const UPCOMING_BONUSES = 10;

const formatPerLevelBonus = (name: string, value: number) => name
  .replace('{', '' + commaNotation(value))
  .replace('}', '' + value / 100)
  .replace('$', '' + Math.floor((value + 4) / (value + 100) * 1000) / 10);

const getNextIndexes = (rawBonus: any, cycle: any) => {
  const currentIndexes = emperorBonuses.reduce((acc: number[], bonus, idx) => {
    if (bonus.index === rawBonus.index) acc.push(idx + (cycle * 48));
    return acc;
  }, [] as number[]);

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

// game: Thingies("Boss6HP"), gameTables.emperorBossHp
export const getBossHp = (highestEmperorShowdown: any) => {
  const { base, growth } = gameTables.emperorBossHp;
  return base * Math.pow(growth, highestEmperorShowdown);
}

export const getEmperorBonus = (account: any, index: any) => {
  return account?.emperor?.bonuses?.find(({ rawIndex }: any) => rawIndex === index)?.totalBonus ?? 0;
}