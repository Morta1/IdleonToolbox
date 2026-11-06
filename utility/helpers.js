import { format, getDaysInMonth, getDaysInYear, intervalToDuration, isValid } from 'date-fns';
import { simulatedCompanionsKey } from '@components/constants';
import { readLocalStorageValue } from '@mantine/hooks';
import merge from 'lodash.merge';
import { copyText } from '@utility/clipboard';
import { errorMessage, trackEvent } from '@utility/analytics';
import { fullDigits, notateNumber, numberWithCommas, preciseDigits } from './notate.mjs';

export const getTabs = (array, label, tabName, nestedTabName) => {
  const navItem = array.find((item) => item.label === label);

  if (!navItem) return [];

  // If we're looking for a specific tab's nested tabs
  if (tabName) {
    const nestedItems = navItem.nestedTabs?.filter((item) => item.tab === tabName);

    // If we're looking for a specific nested tab's nested tabs
    if (nestedTabName) {
      const deepNestedItem = nestedItems?.find((item) => item.nestedTab === nestedTabName);
      return deepNestedItem?.nestedTabs || [];
    }

    // Just return the nested tab names for the specified tab
    return nestedItems?.map(({ nestedTab }) => nestedTab) || [];
  }

  // Return top-level tabs
  return navItem.tabs?.map((item) => item?.tab || item) || [];
};

export const downloadFile = (data, filename) => {
  const blob = new Blob([data], { type: 'text/json' });
  const link = document.createElement('a');

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

  const evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });

  link.dispatchEvent(evt);
  link.remove()
}

export const sortKeys = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj).sort().reduce((sorted, key) => {
    sorted[key] = sortKeys(obj[key]);
    return sorted;
  }, {});
};

// Calculating days manually because of JS limitation for dates https://262.ecma-international.org/5.1/#sec-15.9.1.1
const msPerDay = 8.64e+7;
export const getTimeAsDays = (time) => {
  return Math.ceil(time * 3600 * 1000 / msPerDay);
}
export const
  number2letter = [
    "_",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "肥",
    "肢",
    "肖",
    "肋",
    "肉",
    "職",
    "耐",
    "者",
    "箱",
    "管",
    "算",
    "箔",
    "策",
    "答",
    "筒",
    "筍",
    "白",
    "発",
    "癒",
    "痛",
    "痕",
    "病",
    "疾",
    "疲",
    "潤",
    "潜",
    "漬",
    "漠",
    "演",
    "漏",
    "漁",
    "滞",
    "毎",
    "殻",
    "殺",
    "段",
    "殖",
    "残",
    "歳",
    "歯",
    "歩",
    "武",
    "歓",
    "欲",
    "次",
    "欠",
    "櫛",
    "機",
    "色",
    "村",
    "材",
    "杉",
    "本",
    "末",
    "未",
    "木",
    "授",
    "掃",
    "捧",
    "彼",
    "役",
    "影",
    "彫",
    "彩",
    "胃",
    "堪",
    "城",
    "坑",
    "努",
    "助",
    "加",
    "功",
    "力",
    "創",
    "割",
    "借",
    "候",
    "倒",
    "老",
    "個",
    "景",
    "是",
    "明",
    "昇",
    "早",
    "既",
    "掴",
    "担",
    "想",
    "扉",
    "戻",
    "懸",
    "懲",
    "憩",
    "態",
    "感",
    "蛮",
    "蛍",
    "虫",
    "虚",
    "蘇",
    "薬",
    "薄",
    "蔵"
];

/** @returns {any} */
export const tryToParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};

export const findNameCombination = (arr, str) => {
  if (!arr) return [];
  let result = [];

  function find(str, combination) {
    if (str === '') {
      result.push(combination);
      return;
    }

    for (let i = 0; i < arr.length; i++) {
      if (str?.startsWith(arr[i]?.name)) {
        find(str.slice(arr[i]?.name?.length), [...combination, arr[i]]);
      }
    }
  }

  find(str, []);

  return result.flat();
}

export const createArrayOfArrays = (array) => {
  return array?.map((object) => {
    if (!Array.isArray(object)) {
      delete object?.length;
    }
    return Object.values(object);
  });
};

export const createIndexedArray = (object) => {
  const keys = Object.keys(object).map(Number).filter(k => !isNaN(k));
  if (!keys.length) return Object.values(object);
  const highest = Math.max(...keys);
  let result = [];
  for (let i = 0; i <= highest; i++) {
    if (i in object) {
      result[i] = object[i];
    }
    else {
      result[i] = {};
    }
  }
  return result;
};

export { growth } from './wiki/growth.mjs';
export { fullDigits, GAME_LN10, lavaLog, notateNumber, notateProgress, numberWithCommas } from './notate.mjs';

export const lavaLog2 = (num) => {
  return Math.log(Math.max(num, 1)) / Math.log(2);
};

export const round = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const createRange = (start, end) => {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
}
export const cloneObject = (data) => {
  try {
    return structuredClone(data);
  } catch (err) {
    return data;
  }
};

// The game's ALL-CAPS names read in Title Case on a card ("PEARL_VALUE" to "Pearl Value", Cards board: never uppercase).
// Display only: the game's data keeps its caps. Pass it the name once its underscores are gone.
const TITLE_SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to']);
const TITLE_KEPT_CAPS = /^(VIP|XP|EXP|AFK|DPS|HP|MP|DNA|EMP|3D|FMJ|DMG|NRG|[IVX]+)$/;
export const titleCaseName = (name) => `${name ?? ''}`.split(' ').map((word, index) => {
  if (TITLE_KEPT_CAPS.test(word)) return word;
  const lower = word.toLowerCase();
  if (index > 0 && TITLE_SMALL_WORDS.has(lower)) return lower;
  return lower.replace(/(^|-)([a-z])/g, (_, start, letter) => `${start}${letter.toUpperCase()}`);
}).join(' ');

export const cleanUnderscore = (str) => {
  try {
    if (!str) return '';
    return String(str)?.replace(/_/g, ' ');
  } catch (err) {
    console.log(`Error in cleanUnderscore for ${str}`, err);
  }
};

// The game writes "@" for a line break inside a description (Summoning, Spelunking, Lamp wishes).
// keepBlank keeps the empty lines a help note spaces itself with ("@___@"). sentences joins a break the game made only
// to fit its box, mid-sentence: the next line starts lowercase ("the delve@at the time") or the line before ends on a
// number ("give +1@Scurge EXP"). A break after a sentence's end, a blank line, a bonus list ("@+3% Bits gain") and a
// "Total Bonus:" line stay lines.
const SENTENCE_END = /[.!?:]$/;
const MID_SENTENCE = (before, line) => !SENTENCE_END.test(before) && (/^[a-z]/.test(line) || /\d$/.test(before));
export const gameLines = (text, { keepBlank = false, sentences = false } = {}) => {
  const lines = cleanUnderscore(text).split('@').map((line) => line.trim());
  if (keepBlank) return lines;
  if (!sentences) return lines.filter(Boolean);
  // A blank line is a paragraph break: the line after it never joins
  return lines.reduce(({ joined, broke }, line) => {
    if (!line) return { joined, broke: true };
    const before = joined.at(-1);
    return before !== undefined && !broke && MID_SENTENCE(before, line)
      ? { joined: [...joined.slice(0, -1), `${before} ${line}`], broke: false }
      : { joined: [...joined, line], broke: false };
  }, { joined: [], broke: false }).joined;
};

// Star sign bonuses use "{" as a value placeholder, but decimal-valued bonuses
// use the "{.{" token pair instead, so both have to be substituted. The game data writes a sign's level condition
// with a glyph its font draws: "(If_Lv&60)" means at least 60 (the parser counts the sign from classLevel >= 60).
// A curse's line writes its own minus ("-{%_Total_HP") over a negative bonus, where the game's list has one ("-80%_Total_HP").
export const formatStarSignBonus = (rawName, bonus) => {
  if (!rawName) return '';
  const value = String(rawName).includes('-{') ? Math.abs(bonus) : bonus;
  return String(rawName).replace('{.{', value).replace(/{/g, value).replace(/&/g, '≥');
};

// A talent's line as the game fills it (N.js's StringTools.replace takes every "{" and "}": a line can hold two), its "@"
// breaks mid-sentence ("Getting_4@kills_in_4@sec") joined.
export const talentText = (description, mainStat, secondaryStat) => gameLines(`${description ?? ''}`.replace(/{/g, mainStat).replace(/}/g, secondaryStat),
  { sentences: true }).join(' ');

export const getNumberWithOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Every digit a typed number has, grouped: for a field's own text, which isn't a number being shown (formatNum).
export const groupDigits = (value) => numberWithCommas(value);

export const pascalCase = (str) => {
  return str
    ?.split(/_/g)
    .map((word) => word.toLowerCase().charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join('_');
};

export const getCoinsArray = (coins) => {
  if (!Number.isFinite(coins)) return [];
  const highestCoinIndex = 30;
  let n = BigInt(Math.floor(coins)).toString();

  let ret = new Map();
  let i = 1;
  while (n.length > 0 && i < highestCoinIndex) {
    if (n.length < 2) {
      ret.set(i, Number(n));
      n = '';
      break;
    }
    const quantity = Number(n.slice(-2));
    ret.set(i, quantity);
    n = n.slice(0, -2);
    i += 1
  }

  if (n.length > 0) {
    ret.set(highestCoinIndex, Number(n));
  }

  if (ret.size === 0) {
    ret.set(1, 0);
  }

  ret = new Map([...ret].sort((a, b) => a[0] - b[0]).reverse())
  return Array.from(ret);
};

export const getBitIndex = (e) => {
  let bits = e, num = 0;
  for (let i = 0; i < 5; i++) {
    if (bits > 1e18) {
      bits /= 1e18;
      num++;
    }
  }
  return num;
}
export const commaNotation = (number) => {
  // Initialize variables
  let formattedNumber = '';

  // The game shortens past 1e9 so the digit string never reaches exponential notation
  let roundedNumberAsString = '' + Math.round(number);
  let suffix = '';
  if (number > 1e9) {
    roundedNumberAsString = '' + Math.round(number / 1e6);
    suffix = 'M';
    if (number > 1e15) {
      roundedNumberAsString = '' + Math.round(number / 1e12);
      suffix = 'T';
      if (number > 1e21) {
        roundedNumberAsString = '' + Math.round(number / 1e18);
        suffix = 'QQ';
      }
    }
  }
  // From 1e39 even the QQ digits print in e notation (2.77e+21), and the grouping below would cut that up.
  if (number === Infinity || roundedNumberAsString.includes('e')) return String(notateNumber(number, 'Big'));

  // Calculate number of commas needed
  const numberOfCommas = Math.floor((roundedNumberAsString.length - 1) / 3) + 1;

  // Calculate number of digits after last comma
  const digitsAfterLastComma = roundedNumberAsString.length - 3 * Math.floor((roundedNumberAsString.length - 1) / 3);

  // Iterate over the number of commas and format the number
  for (let i = 0; i < numberOfCommas; i++) {
    if (i === 0) {
      formattedNumber = roundedNumberAsString.substring(0, digitsAfterLastComma);
    }
    else {
      formattedNumber += ',' + roundedNumberAsString.substring(digitsAfterLastComma + 3 * (i - 1), digitsAfterLastComma + 3 * i);
    }
  }

  // Return formatted number
  return formattedNumber + suffix;
}

// The game's usual switch, and the form of a whole thing (the whole kind): commas below 1M, its "Big" notation from there.
// `round` applies to the comma branch only, so callers keep their floor/ceil there.
export const commaOrBig = (value, round = Math.round) => 1e6 > value ? commaNotation(round(value)) : notateNumber(value, 'Big');

// A number as a short format printed it, read back as whole digits and a power of ten ("12,258": 12258 and 0, "12.3M":
// 123 and 5, "7.3e181": 73 and 180)
const SHOWN_POWERS = { '': 0, K: 3, M: 6, B: 9, T: 12, Q: 15, QQ: 18 };
const shownDigits = (text) => {
  const [, whole = '0', fraction = '', suffix = '', exponent = '0'] = String(text).replace(/,/g, '')
    .match(/^(\d+)(?:\.(\d+))?([A-Z]*)(?:e(\d+))?$/) ?? [];
  return { digits: Number(whole + fraction), power: (SHOWN_POWERS[suffix] ?? 0) + Number(exponent) - fraction.length };
};
// The bracket rule: a gain or a balance beside two printed numbers is the difference of the numbers as shown (to minus
// from), so it always adds up, the game's Big and e-notation included ("12,258 → 12,342 (+84)", "146 - 12 = 134")
export const shownDifference = (fromText, toText) => {
  const [from, to] = [shownDigits(fromText), shownDigits(toText)];
  const power = Math.min(from.power, to.power);
  return (to.digits * 10 ** (to.power - power) - from.digits * 10 ** (from.power - power)) * 10 ** power;
};
// The same rule for a share: "X of Y (Z%)" is X over Y as shown, so the percent always reads as the two numbers do
export const shownPercent = (partText, wholeText) => {
  const [part, whole] = [shownDigits(partText), shownDigits(wholeText)];
  return whole.digits > 0 ? part.digits / whole.digits * 10 ** (part.power - whole.power) * 100 : null;
};

// The site's one rule (the owner, 2026-11-04, for the endgamers who read the decimals): below 1M a number shows the
// decimals it has, up to two, with commas, rounded, the trailing zeros dropped; from 1M up it reads the game's short
// form, as the game's key or the kind says. So 6.34x, 1,529.05x, 6,395.65%, 3.59, and past 1M 1.93e21x. No setting: low
// numbers read the same either way. A value's fraction under about 0.005 is float noise, so it reads whole, and a very
// small value keeps two significant digits (0.0012%, not 0%).
// The number itself never changes, only how many digits show. A whole thing computed as a fraction stays whole, as the
// game prints it, by asking for that where it prints: a cost, a requirement, kills, an item count, a balance (Cost 363,
// never 362.4). The whole kind here; { whole: true } in formatGame, whole on <Num>. Default to decimals, opt out on
// purpose. Where the game ceils or floors one, the call site keeps that direction. Durations, odds, levels and prices
// have their own forms and take no part.
//
// Numbers board, lane B: a number only the toolbox shows, in the game's usual format for its kind. Every kind
// notates the magnitude and draws the sign itself, because the game's NotateNumber assumes a positive number.
//   amount  totals, stats               the rule, Big from 1M                                 3.59 · 21,146 · 2.16Q
//   whole   costs, requirements, counts CommaNotation below 1M, Big from there (commaOrBig)   21,146 · 2.16Q
//   mult    anything that multiplies    MultiplierInfo (two decimals, always) with commas, Big from 1M, then x
//                                                                                             19.21x · 14.00x · 5.14Mx
//   pct     bonuses, chances            the rule, Big from 1M, then %                         88.51% · 6,395.65% · 1.16M%
//   rate    per hour, per kill          a signed amount per unit                              +61,080.25/hr · +6.51e31/hr
//   level   levels and caps             Lv, commas, the cap after a slash                     Lv 106 / 250
//   odds    a chance from 0 to 1        1 in N, commas                                        1 in 152
//   price   real money (bundles)        a dollar sign, two decimals                           $4.99
//   exact   the digits behind a short number (a note): commas, up to 3 decimals, Big past 2^53   1,234.568
// Options: signed (a change: +144%), precise (up to 3 decimals, the toolbox's ThreeDecimals, for breakdown totals
// and values endgamers push), decimals (exactly that many, zeros kept, below 1M, for a column whose values line up:
// 15.0%, 4.0%), significant (that many significant figures, zeros kept, at any size, for a ranking whose rows must tell
// neighbours apart: 35.0M, 0.20), bare (no % or x: the game's own sentence carries it), max and next (level), per (rate,
// default hr).

const fixedDigits = (value, decimals) => numberWithCommas(value.toFixed(decimals));

// Where the rule hands over to the short form, every kind and mode alike.
export const SHORT_FROM = 1e6;

const SHORT_SUFFIXES = [[1e18, 'QQ'], [1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [SHORT_FROM, 'M']];
// Past QQ the short form is a power of ten.
const SCIENTIFIC_FROM = 1e21;

// Rounded on the value's own digits before it is scaled, so 999.6M moves on to 1.00B.
const significantDigits = (value, significant) => {
  if (value === 0 || value === Infinity) return String(notateNumber(value));
  const rounded = Number(value.toPrecision(significant));
  if (rounded >= SCIENTIFIC_FROM) {
    const [mantissa, exponent] = rounded.toExponential(significant - 1).split('e');
    return `${mantissa}e${Number(exponent)}`;
  }
  const [base, suffix] = SHORT_SUFFIXES.find(([power]) => rounded >= power) ?? [1, ''];
  const scaled = rounded / base;
  return `${fixedDigits(scaled, Math.max(0, significant - Math.floor(Math.log10(scaled)) - 1))}${suffix}`;
};

// The rule's digits where the print is the game's own two decimals: 14.00 keeps its zeros
export const multiplierDigits = (value) => (value > 0 && value < 0.01 ? fullDigits(value) : numberWithCommas(notateNumber(value, 'MultiplierInfo')));

// The modes z-processing names for the game's plain arithmetic fills (analysis/facts/gameNotation.js): `Math.floor(x)`,
// `Math.floor(10 * x) / 10`, `Math.round(x)`, `Math.ceil(x)`. A caller adds any offset the game adds (attack speed's 100).
const PLAIN = {
  Floor: (value) => String(Math.floor(value)),
  Tenths: (value) => String(Math.floor(10 * value) / 10),
  Round: (value) => String(Math.round(value)),
  Ceil: (value) => String(Math.ceil(value))
};

// The game's own print of a value in one mode: what a whole thing keeps, and any value from 1M up
const gamePrint = (magnitude, mode) => (PLAIN[mode] ? PLAIN[mode](magnitude)
  : String(mode === 'Comma' ? commaNotation(magnitude) : notateNumber(magnitude, mode)));

// The one way a parser or a page prints a number in a game sentence. The site's rule (notes above formatNum): below 1M a
// value shows its decimals in every mode, so the mode only picks the short form from 1M up. whole prints a whole thing
// (a cost, a requirement, a count) as the game does, in its mode's direction. Bits are a currency with tiers of their
// own, and Whole is a whole thing by name. The sign is drawn outside the notation.
export const gameFill = (value, mode, { whole = false } = {}) => {
  const magnitude = Math.abs(value);
  const printsAsGame = whole || magnitude >= SHORT_FROM || mode === 'Bits' || mode === 'Whole';
  const text = printsAsGame ? gamePrint(magnitude, mode) : mode === 'MultiplierInfo' ? multiplierDigits(magnitude) : fullDigits(magnitude);
  return value < 0 ? `-${text}` : text;
};

const KIND_FORMATS = {
  amount: (value, precise, decimals) => (SHORT_FROM <= value ? notateNumber(value, 'Big')
    : decimals != null ? fixedDigits(value, decimals) : precise ? numberWithCommas(preciseDigits(value)) : fullDigits(value)),
  whole: (value) => commaOrBig(value),
  // An exact 0 (nothing multiplied yet) reads 0x, not MultiplierInfo's 0.00x.
  mult: (value, precise, decimals) => (SHORT_FROM <= value ? notateNumber(value, 'Big')
    : decimals != null ? fixedDigits(value, decimals) : precise ? numberWithCommas(preciseDigits(value))
      : value === 0 ? '0' : multiplierDigits(value)),
  pct: (value, precise, decimals) => (SHORT_FROM <= value ? notateNumber(value, 'Big')
    : decimals != null ? fixedDigits(value, decimals) : precise ? numberWithCommas(preciseDigits(value)) : fullDigits(value)),
  // Real money (bundle prices): two decimals, always.
  price: (value) => `$${numberWithCommas(value.toFixed(2))}`,
  // Every digit, for the exact number behind a short one (a note): commas, up to three decimals. Never digits a double
  // can't hold: past 2^53 its integer digits stop being exact (a harp note's 41.1QQ printed 41,105,488,426,643,972,096),
  // so it reads the Big rule, as the short number beside it does. A whole number prints as it is: ThreeDecimals'
  // 1000 * x passes 2^53 from about 9e12 and turned a rupie count of 79,138,063,219,213 into 79,138,063,219,212.98.
  exact: (value) => (Number.isFinite(value) && value >= Number.MAX_SAFE_INTEGER ? notateNumber(value, 'Big')
    : numberWithCommas(Number.isInteger(value) ? String(value)
      // ThreeDecimals' 1000 * x passes 2^53 from about 9e12: no decimal past it is real
      : value >= 9e12 ? String(Math.round(value)) : notateNumber(value, 'ThreeDecimals')))
};

// The game draws a multiplier's x and a percent's % after the number. bare leaves them to the game's own sentence.
const UNITS = { mult: 'x', pct: '%' };

const signOf = (value, signed) => (value < 0 ? '-' : signed && value > 0 ? '+' : '');

export const formatNum = (value, kind = 'amount', { signed = false, precise = false, decimals, significant, bare = false, max, next, per = 'hr' } = {}) => {
  if (value == null || Number.isNaN(value)) return '-';
  if (kind === 'level') {
    const level = `Lv ${commaNotation(value)}`;
    if (max != null) return `${level} / ${commaNotation(max)}`;
    return next != null ? `${level} · next ${commaNotation(next)}` : level;
  }
  if (kind === 'odds') return value > 0 ? `1 in ${commaNotation(1 / value)}` : '-';
  const magnitude = Math.abs(value);
  if (kind === 'rate') return `${signOf(value, true)}${KIND_FORMATS.amount(magnitude, precise, decimals)}/${per}`;
  const text = significant != null ? significantDigits(magnitude, significant) : (KIND_FORMATS[kind] ?? KIND_FORMATS.amount)(magnitude, precise, decimals);
  return `${signOf(value, signed)}${text}${bare ? '' : UNITS[kind] ?? ''}`;
};


export const constellationIndexes = (str) => {
  const indexes = { _: 0, a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9 };
  return str
    ?.split('')
    ?.map((char) => indexes?.[char])
    .sort((a, b) => a - b)
    .map((ind) => ind + 1)
    .join(',');
};

export const worlds = {
  0: 'Blunder Hills',
  1: 'Yum Yum Desert',
  2: 'Frostbite Tundra',
  3: 'Hyperion Nebula',
  4: 'Smolderin\' Plateau',
  5: 'Spirited Valley',
  6: 'World 7'
};

const maxTimeValue = 9.007199254740992e+15;
export const getDuration = (start, end) => {
  if (!isValid(start) || !isValid(end)) {
    return 0;
  }
  if (start > maxTimeValue || end > maxTimeValue) {
    return {};
  }
  try {
    const parsedStartTime = new Date(start);
    const parsedEndTime = new Date(end);
    let duration = intervalToDuration({ start: parsedStartTime, end: parsedEndTime });
    if (duration?.years) {
      const daysInYear = getDaysInYear(new Date());
      duration.days = duration.days + daysInYear * duration?.years;
      duration.years = 0;
    }
    if (duration?.months) {
      const daysInMonth = getDaysInMonth(new Date());
      duration.days = duration.days + daysInMonth * duration?.months;
      duration.months = 0;
    }
    return duration;
  } catch (err) {
    console.error('getDuration -> Error occurred when trying to format date', start, end);
    return {};
  }
};

// Hours left before the game's daily reset. timeAway.ShopRestock is a countdown in seconds, captured
// at the moment the save was taken, so a stale save has to have the elapsed time taken back off it
// (timeAway.GlobalTime is when that snapshot happened). Null once the save is older than the reset
// it was counting down to, because then there is nothing left to read a deadline off.
export const hoursUntilDailyReset = (account, now = Date.now()) => {
  if (!Number.isFinite(account?.timeAway?.GlobalTime)) return null;
  const remaining = (getDailyResetAt(account) - Math.max(now, account.timeAway.GlobalTime * 1000)) / 1000;
  return remaining > 0 ? remaining / 3600 : null;
};

// Timestamp (ms) of the daily reset the save was counting down to; in the past once the save
// outlived it. `fallbackSavedAt` stands in for GlobalTime on saves without one. NaN without ShopRestock.
export const getDailyResetAt = (account, fallbackSavedAt = Date.now()) => {
  const savedAt = account?.timeAway?.GlobalTime;
  return (Number.isFinite(savedAt) ? savedAt * 1000 : fallbackSavedAt) + account?.timeAway?.ShopRestock * 1000;
};

// Next reset after `clock`, `days` past the daily one; one the save already outlived rolls on by
// `period`. Null without ShopRestock.
export const getNextResetAt = (account, clock, { days = 0, period = 864e5, fallbackSavedAt = clock } = {}) => {
  const resetAt = getDailyResetAt(account, fallbackSavedAt) + days * 864e5;
  if (!Number.isFinite(resetAt)) return null;
  return resetAt > clock ? resetAt : resetAt + (Math.floor((clock - resetAt) / period) + 1) * period;
};

export const totalHoursBetweenDates = (start, end) => {
  try {
    const duration = intervalToDuration({ start, end });

    // Convert years, months, and days into hours
    const yearsToHours = duration.years * 365.25 * 24; // considering leap years
    const monthsToHours = duration.months * 30.44 * 24; // average month length
    const daysToHours = duration.days * 24;

    // Calculate the total hours
    return yearsToHours + monthsToHours + daysToHours + duration.hours;
  } catch (e) {
    console.error('totalHoursBetweenDates -> Error occurred when trying to format date', start, end);
    return {};
  }
}

// Character slots the game currently sells. Its unlock table is
// [0, 8, 30, 70, 150, 300, 500, 750, 1100, 1500, 5e3, 99999, ...] indexed by how many characters
// you own - index 10 costs 5000 combined levels for the 11th, and 99999 past that means locked.
// Bump this when that sentinel moves.
export const MAX_CHARACTERS = 11;

export const fillArrayToLength = (length, array, defaultValue = {}) => {
  return [...new Array(length)].map((item, index) => {
    return array !== undefined ? array?.[index] ?? defaultValue : defaultValue;
  });
};

// A span in hours as every time reads (Numbers board, Time left: the two largest units, "68d 12h"). Its callers are an
// elapsed time (Bubba's smoker) and a wait the caller already keeps above zero, so no Ready at zero.
export const splitTime = (numberOfHours) => secondsToShortDuration(numberOfHours * 3600);

export const randomFloatBetween = function (e, t) {
  return e <= t ? e + Math.random() * (t - e) : t + Math.random() * (e - t)
}

export const flatten = (obj, out) => {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] == 'object') {
      out = flatten(obj[key], out) //recursively call for nested
    }
    else {
      out[key] = obj[key] //direct assign for values
    }
  });
  return out;
}

export const sections = [
  { name: 'Stats' },
  { name: 'Talents' },
  { name: 'Cards' },
  { name: 'Skills' },
  { name: 'Equipment' },
  { name: 'Obols' },
  { name: 'Obols Stats' },
  { name: 'Inventory' },
  { name: 'Bags' },
  { name: 'Prayers' },
  { name: 'Star Signs' },
  { name: 'Equipped Bubbles' },
  { name: 'Chips' },
  { name: 'Divinity' },
  { name: 'Anvil Details' },
  { name: 'Post Office' }
];

export const isProd = process.env.NODE_ENV === 'production';

export const getRandomNumbersArray = (length, max) => {
  const arr = [];
  while (arr.length < length) {
    const r = Math.floor(Math.random() * max);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}

export const UNKNOWN_TIME = '-';
export const isUnknownTime = (ms) => typeof ms !== 'number' || !Number.isFinite(ms);

export const getRealDateInMs = (ms, shouldFormat = true, formatString = 'dd/MM/yyyy HH:mm:ss') => {
  const dateInMs = ms;
  if (shouldFormat) {
    if (isUnknownTime(dateInMs)) return UNKNOWN_TIME;
    return isValid(new Date(dateInMs))
      ? format(dateInMs, formatString)
      : `${notateNumber(getTimeAsDays(dateInMs))} days`;
  }
  return dateInMs;
}

// A time left or a span in ms as every time reads (formatDuration: "68d 12h", Ready at zero).
export const msToDate = (ms) => formatDuration(ms / 1000);

// The clock shape "1h:02m:03s", and seconds with milliseconds under a minute: for a time that is a record, not a span
// to wait (the Hole's gambit run times, where 0 means not run and the milliseconds count).
export const msToClock = (ms) => {
  // Calculate the number of hours, minutes, and seconds
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  // Format each component to be two digits
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  const formattedMilliseconds = String(milliseconds).padStart(3, '0');

  // Determine the formatted string based on the time
  if (ms < 60000) {
    // Include milliseconds if the time is under one minute
    return `${formattedSeconds}s:${formattedMilliseconds}ms`;
  }
  else {
    // Regular format for time above one minute
    return `${formattedHours}h:${formattedMinutes}m:${formattedSeconds}s`;
  }
}

const SECONDS_IN = { minute: 60, hour: 3600, day: 86400, year: 31536000 };

/**
 * A single rounded unit for spans that can reach centuries, where the clock shape's hours-only format
 * stops being readable. Anything past a human lifetime reads as "never".
 */
export const secondsToCoarseDuration = (seconds) => {
  if (!(seconds > 0)) return null;
  if (seconds < SECONDS_IN.hour) return `${Math.max(1, Math.round(seconds / SECONDS_IN.minute))}m`;
  if (seconds < SECONDS_IN.day) return `${Math.round(seconds / SECONDS_IN.hour)}h`;
  if (seconds < SECONDS_IN.year) return `${Math.round(seconds / SECONDS_IN.day)}d`;
  const years = seconds / SECONDS_IN.year;
  if (years >= 100) return 'never';
  return `${years < 10 ? years.toFixed(1) : Math.round(years)}y`;
}

/**
 * Up to the two largest units ("2d 5h", "3m 12s") for compact countdowns and split times.
 * minUnit floors the precision: 'minute' turns sub-minute spans into "1m" instead of seconds.
 */
export const secondsToShortDuration = (seconds, { minUnit = 'second' } = {}) => {
  if (!Number.isFinite(seconds)) return '-';
  const floorSeconds = minUnit === 'minute' ? SECONDS_IN.minute : 1;
  if (seconds < floorSeconds) return minUnit === 'minute' ? '1m' : '<1s';
  const units = [
    { label: 'd', size: SECONDS_IN.day },
    { label: 'h', size: SECONDS_IN.hour },
    { label: 'm', size: SECONDS_IN.minute },
    { label: 's', size: 1 }
  ].filter(({ size }) => size >= floorSeconds);
  const first = units.findIndex(({ size }) => seconds >= size);
  const major = units[first];
  const minor = units[first + 1];
  if (!minor) return `${Math.round(seconds / major.size)}${major.label}`;
  let majorValue = Math.floor(seconds / major.size);
  let minorValue = Math.round((seconds % major.size) / minor.size);
  if (minorValue * minor.size >= major.size) {
    majorValue += 1;
    minorValue = 0;
  }
  return minorValue > 0 ? `${majorValue}${major.label} ${minorValue}${minor.label}` : `${majorValue}${major.label}`;
}

// Numbers board, Time left: the two largest units, Ready at zero, and past 999 days it says so.
const MAX_DURATION_DAYS = 999;
export const formatDuration = (seconds) => {
  if (seconds == null || Number.isNaN(seconds)) return '-';
  if (seconds <= 0) return 'Ready';
  if (seconds > MAX_DURATION_DAYS * SECONDS_IN.day) return `> ${MAX_DURATION_DAYS}d`;
  return secondsToShortDuration(seconds);
};

export const fillMissingTalents = (arr) => {
  const talentIds = arr.map(obj => obj.talentId);
  const minTalentId = Math.min(...talentIds);
  const maxTalentId = Math.max(...talentIds);

  const missingNumbers = Array.from({ length: maxTalentId - minTalentId + 1 }, (_, i) => i + minTalentId)
    .filter(num => !talentIds.includes(num))
    .map(talentId => ({ talentId }));

  return arr.concat(missingNumbers)
}

export const removeDuplicatesByKey = (array, key) => {
  const uniqueKeys = new Set();
  return array.filter(obj => {
    const keyValue = obj[key];
    if (!uniqueKeys.has(keyValue)) {
      uniqueKeys.add(keyValue);
      return true;
    }
    return false;
  });
}

export const groupByKey = (array, callback) => {
  return array.reduce(function (groups, item) {
    const key = callback(item);

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(item);
    return groups;
  }, {})
}

export const migrateConfig = (type, baseConfig, userConfig, baseVersion, userVersion) => {
  if (baseVersion !== userVersion) {
    if (type === 'account') {
      return merge(baseConfig, renameSettingInPostOffice(userConfig));
    }
    else {
      return merge(baseConfig, userConfig);
    }
  }
  return merge(baseConfig, userConfig);
}

function renameSettingInPostOffice(obj) {
  if (obj?.['World 2']?.postOffice && obj?.['World 2']?.postOffice.options) {
    obj['World 2'].postOffice.options = obj?.['World 2']?.postOffice.options.map(option => {
      if (option.name === 'shields') {
        return { ...option, name: 'dailyShipments', category: 'dailyShipments' };
      }
      return option;
    }).filter((option) => option.name !== 'postOffice');
  }
  return obj;
}

export const handleCopyToClipboard = async (data, beautify = true) => {
  const text = beautify ? JSON.stringify(data, null, 2) : data;
  return copyText(text);
};

export const handleDownload = (jsonData, fileName) => {
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.json`;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const sanitizeRawData = (data) => {
  if (!data?.MapBon) return data;
  const mapBon = typeof data.MapBon === 'string' ? tryToParse(data.MapBon) : data.MapBon;
  if (!Array.isArray(mapBon)) return data;
  return {
    ...data,
    MapBon: mapBon.map((entry) => Array.isArray(entry) ? entry.slice(0, 3) : entry)
  };
};

export const setRawJson = (payload) => {
  const serialized = JSON.stringify(payload);
  try {
    sessionStorage.setItem('rawJson', serialized);
    return true;
  } catch (error) {
    try {
      sessionStorage.removeItem('rawJson');
      sessionStorage.setItem('rawJson', serialized);
      return true;
    } catch (retryError) {
      console.error('Could not cache raw save data in sessionStorage:', retryError);
      return false;
    }
  }
};

export const copyForSupport = async (account, characters) => {
  const { expandLeaderboardInfo } = await import('../services/leaderboardInfo');
  const data = JSON.parse(sessionStorage.getItem('rawJson'));
  const extraData = expandLeaderboardInfo(account, characters);
  const sanitized = { ...data, data: sanitizeRawData(data?.data) };
  return copyText(JSON.stringify(sortKeys({ ...sanitized, extraData }), null, 2));
};

export const copyRawData = async () => {
  const data = JSON.parse(sessionStorage.getItem('rawJson'));
  return copyText(JSON.stringify(sortKeys(sanitizeRawData(data?.data)), null, 2));
};

export const handleLoadJson = async (dispatch) => {
  try {
    const content = JSON.parse(await navigator.clipboard.readText());
    let { data = content, charNames, companion, guildData, serverVars = {}, accountCreateTime, tournament } = content;
    const { parseSave } = await import('@utility/parseSave');
    const parsedData = await parseSave(data, charNames, companion, guildData, serverVars, accountCreateTime, tournament, {
      simulatedCompanions: readLocalStorageValue({ key: simulatedCompanionsKey, defaultValue: [] })
    });
    const lastUpdated = new Date().getTime();
    localStorage.setItem('lastUpdated', JSON.stringify(lastUpdated));
    // console.log('Manual Import', { ...parsedData, lastUpdated, manualImport: true });
    setRawJson({
      data,
      charNames,
      companion,
      guildData,
      serverVars,
      accountCreateTime,
      tournament,
      lastUpdated
    });
    dispatch({ type: 'data', data: { ...parsedData, lastUpdated, manualImport: true, emptyAccount: false } });

    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'save_imported', {
        event_category: 'engagement',
        event_label: 'manual',
        value: parsedData?.characters?.length ?? 0
      });
    }
  } catch (e) {
    console.error('Error while trying to manual import', e);
    trackEvent('import_failed', { import_source: 'manual', error_message: errorMessage(e) });
  }
}

export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true;
  } catch (e) {
    return false;
  }
}


export const worldsArray = ['World 1', 'World 2', 'World 3', 'World 4', 'World 5', 'World 6', 'World 7'];
export const prefix = isProd ? '/' : '/';

export const excludedPortals = {
  0: [0],
  9: [0],
  17: [0],
  24: [1],
  27: [0],
  28: [0],
  30: [0],
  31: [0],
  38: [0],
  60: [1],
  65: [0],
  69: [0],
  113: [0],
  117: [0],
  120: [0],
  166: [0],
  213: [0],
  264: [0]
}

// Parses shorthand notations like '12B', '2QQ', '3.2QQQ' into numbers
// Also handles locale-specific thousands separators like '12.000.000' (German) or '12,000,000' (US)
// Supports various international formats:
// - US: '12,000.5' or '12,000'
// - German/European: '12.000,5' or '12.000'
// - French: '12 000,5' or '12 000'
// - Decimal with comma: '12,5' (12.5)
// - Decimal with period: '12.5' (12.5)
export function parseShorthandNumber(text) {
  if (typeof text !== 'string') return NaN;
  // One minus in front of a digit is a sign; the rest of the text parses without it ('--123' still reads 123).
  const negative = /^\s*-(?=[\d.,])/.test(text);
  const signed = (value) => (negative ? -value : value);
  const input = negative ? text.replace(/^\s*-/, '') : text;

  // Game notation past the suffixes ("3.2e12", "10e58"). The mantissa is a plain decimal, so the thousands
  // guesses below never see it; commas in it are grouping.
  const exponent = input.trim().match(/^([\d.,]*\d)e([+-]?\d+)$/i);
  if (exponent) return signed(Number(`${exponent[1].replace(/,/g, '')}e${exponent[2]}`));

  const multipliers = {
    '': 1,
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12,
    q: 1e15
  };

  // First, extract any suffix and convert to lowercase
  const lowerInput = input.trim().toLowerCase();

  // Extract suffix (k, m, b, t, q, etc.) before cleaning
  const suffixMatch = lowerInput.match(/([kmbtq]+)$/);
  const suffix = suffixMatch ? suffixMatch[1] : '';
  const withoutSuffix = suffixMatch ? lowerInput.slice(0, -suffix.length) : lowerInput;

  // Now remove everything except digits, commas, and periods
  // This is more robust than trying to list all possible separator characters
  const cleaned = withoutSuffix.replace(/[^\d.,]/g, '');

  const numberPart = cleaned;

  // Validate that numberPart contains only digits, commas, and periods
  if (!/^[\d.,]+$/.test(numberPart)) return NaN;

  // Count occurrences of comma and period
  const commaCount = (numberPart.match(/,/g) || []).length;
  const periodCount = (numberPart.match(/\./g) || []).length;
  const hasComma = commaCount > 0;
  const hasPeriod = periodCount > 0;

  let normalizedNumber = numberPart;

  // Strategy: Determine which character is the decimal separator
  if (hasComma && hasPeriod) {
    // Both present: the last one is typically the decimal separator
    const lastCommaIndex = numberPart.lastIndexOf(',');
    const lastPeriodIndex = numberPart.lastIndexOf('.');

    if (lastCommaIndex > lastPeriodIndex) {
      // Comma is decimal separator (e.g., '12.000,5')
      normalizedNumber = numberPart.replace(/\./g, '').replace(',', '.');
    }
    else {
      // Period is decimal separator (e.g., '12,000.5')
      normalizedNumber = numberPart.replace(/,/g, '');
    }
  }
  else if (hasComma && !hasPeriod) {
    // Only comma: determine if it's decimal or thousands separator
    if (commaCount === 1) {
      // Single comma: check context
      const commaIndex = numberPart.indexOf(',');
      const digitsAfterComma = numberPart.length - commaIndex - 1;
      const digitsBeforeComma = commaIndex;

      // Heuristic for determining separator type:
      // 1. Exactly 3 digits after + 1-3 digits before = proper thousands separator
      // 2. 1-2 digits after = decimal separator
      // 3. 4+ digits after = likely misplaced thousands separator from editing (e.g., '131,3133' when typing '1313133')
      //    Remove separator and treat as whole number
      // 4. 3 digits after + 4+ digits before = decimal separator

      const isProperThousandsSeparator = digitsAfterComma === 3 && digitsBeforeComma >= 1 && digitsBeforeComma <= 3;
      const isMisplacedSeparator = digitsAfterComma >= 4;

      if (isProperThousandsSeparator) {
        // Thousands separator (e.g., '1,234', '12,345', '123,456')
        normalizedNumber = numberPart.replace(',', '');
      }
      else if (isMisplacedSeparator) {
        // Misplaced thousands separator from editing (e.g., '131,3133' → '1313133')
        normalizedNumber = numberPart.replace(',', '');
      }
      else {
        // Decimal separator (e.g., '12,5' or '123,45' or '1234,567')
        normalizedNumber = numberPart.replace(',', '.');
      }
    }
    else {
      // Multiple commas: all are thousands separators (e.g., '1,234,567')
      normalizedNumber = numberPart.replace(/,/g, '');
    }
  }
  else if (hasPeriod && !hasComma) {
    // Only period: determine if it's decimal or thousands separator
    if (periodCount === 1) {
      // Single period: check context
      const periodIndex = numberPart.indexOf('.');
      const digitsAfterPeriod = numberPart.length - periodIndex - 1;
      const digitsBeforePeriod = periodIndex;

      // Same heuristic as comma
      const isProperThousandsSeparator = digitsAfterPeriod === 3 && digitsBeforePeriod >= 1 && digitsBeforePeriod <= 3;
      const isMisplacedSeparator = digitsAfterPeriod >= 4;

      if (isProperThousandsSeparator) {
        // Thousands separator (e.g., '1.234', '12.345', '123.456')
        normalizedNumber = numberPart.replace('.', '');
      }
      else if (isMisplacedSeparator) {
        // Misplaced thousands separator from editing (e.g., '131.3133' → '1313133')
        normalizedNumber = numberPart.replace('.', '');
      }
      else {
        // Decimal separator (e.g., '12.5' or '123.45' or '1234.567')
        normalizedNumber = numberPart; // Already correct
      }
    }
    else {
      // Multiple periods: all are thousands separators (e.g., '1.234.567')
      normalizedNumber = numberPart.replace(/\./g, '');
    }
  }
  // else: no comma or period, numberPart is already normalized

  const num = parseFloat(normalizedNumber);
  if (isNaN(num)) return NaN;

  // Handle repeated Qs (QQ = 1e18, etc.)
  if (suffix.startsWith('q') && suffix.length > 1) {
    let base = 1e15;
    for (let i = 1; i < suffix.length; i++) {
      base *= 1e3;
    }
    return signed(num * base);
  }

  return signed(num * (multipliers[suffix] || 1));
}

export const worldColor = ['#64b564', '#f1ac45', '#00bcd4', '#864ede', '#de4e4e', '#5FF1B4FF', '#40e0d0'];
// The free pet claim went weekly -> daily ("The weekly 'Free Pet' chance is now daily. FOREVER."),
// but the deadline formula did not change with it. The game computes the window server-side and
// getFreeCompanionRemainingTime still answers max(0, anchor + 594000000 - now); the daily cadence
// comes from the server back-dating the anchor by 511200000 (594000000 - 23h) on every claim, so
// the deadline lands 23h out. Two consequences worth spelling out, because both have already caused
// a wrong fix here: the anchor reads ~5.9 days stale on a freshly claimed account (that is correct,
// not drift), and pairing it with a 23h or 24h window puts the deadline permanently in the past,
// which is what pinned the timer on "Go claim!".
//
// Verified against a live account by claiming the Pet Mart free pet and re-reading the save:
//   before  anchor 1788156047455  server deadline 1788750047455  (= anchor + 594000000)
//   after   anchor 1788343832258  server deadline 1788937832258  (= anchor + 594000000)
//   after claim: anchor === claimTime - 511200000, deadline - now === 82776948 (~23h)
// The `d` field is a dead legacy timestamp - a real claim leaves it untouched - so it must not be
// used here. See getCompanions in parsers/misc.ts.
const FREE_COMPANION_CLAIM_ANCHOR_OFFSET_MS = 594000000;
export const getNextCompanionClaim = (account) => {
  // The anchor is absolute, so it's compared against the browser clock rather than GlobalTime -
  // GlobalTime is the save snapshot's clock and drifts behind real time between uploads.
  const anchor = account?.companions?.freeClaimAnchor ?? 0;
  if (!isFinite(anchor)) return new Date().getTime();
  return anchor + FREE_COMPANION_CLAIM_ANCHOR_OFFSET_MS;
};

// The Pet Mart restocks both counters (and the free gems) at 20:00 UTC: the game's "New Pets in"
// text counts down to the next point where (GlobalTime + 14400) is a whole number of days.
const PET_MART_RESTOCK_OFFSET_S = 14400;
export const getNextPetMartRestock = (now = Date.now()) => {
  const shifted = now / 1000 + PET_MART_RESTOCK_OFFSET_S;
  return ((Math.floor(shifted / 86400) + 1) * 86400 - PET_MART_RESTOCK_OFFSET_S) * 1000;
};
