import { format, getDaysInMonth, getDaysInYear, intervalToDuration, isValid } from 'date-fns';
import { drawerPages } from '@components/constants';
import merge from 'lodash.merge';

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
// Calculating days manually because of JS limitation for dates https://262.ecma-international.org/5.1/#sec-15.9.1.1
const msPerDay = 8.64e+7;
export const getTimeAsDays = (time) => {
  return Math.ceil(time * 3600 * 1000 / msPerDay);
}
export const eventsColors = {
  'Meteorite': '#f8e8b7',
  'Mega_Grumblo': '#e6b471',
  'Glacial_Guild': '#65b8d6',
  'Snake_Swarm': '#3f9c61',
  'Angry_Frogs': '#f6b5f8'
}

export const
  number2letter = ['_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
    's',
    't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

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
  const highest = Math.max(...Object.keys(object));
  let result = [];
  for (let i = 0; i <= highest; i++) {
    if (object?.[i]) {
      result[i] = object?.[i];
    } else {
      result[i] = {};
    }
  }
  return result;
};

export const growth = (func, level, x1, x2, shouldRound = true) => {
  let result;
  switch (func) {
    case 'add':
      if (x2 !== 0) {
        result = (((x1 + x2) / x2 + 0.5 * (level - 1)) / (x1 / x2)) * level * x1;
      } else {
        result = level * x1;
      }
      break;
    case 'decay':
      result = (level * x1) / (level + x2);
      break;
    case 'intervalAdd':
      result = x1 + Math.floor(level / x2);
      break;
    case 'decayMulti':
      result = 1 + (level * x1) / (level + x2);
      break;
    case 'bigBase':
      result = x1 + x2 * level;
      break;
    case 'special1':
      result = 100 - (level * x1) / (level + x2);
      break;
    default:
      result = 0;
  }
  return shouldRound ? round(result) : result;
};

export const lavaLog = (num) => {
  return Math.log(Math.max(num, 1)) / 2.303;
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
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    return data;
  }
};

export const cleanUnderscore = (str) => {
  try {
    if (!str) return '';
    return String(str)?.replace(/_/g, ' ');
  } catch (err) {
    console.log(`Error in cleanUnderscore for ${str}`, err);
  }
};

export const getNumberWithOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const kFormatter = (num, digits = 1) => {
  if (num === undefined) return null;
  const si = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'Q' },
    { value: 1e18, symbol: 'QQ' }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol;
};

function splitDecimal(numStr, allowNegative = true) {
  const hasNegation = numStr[0] === '-';
  const addNegation = hasNegation && allowNegative;
  numStr = numStr.replace('-', '');

  const parts = numStr.split('.');
  const beforeDecimal = parts[0];
  const afterDecimal = parts[1] || '';

  return {
    beforeDecimal,
    afterDecimal,
    hasNegation,
    addNegation
  };
}

function applyThousandSeparator(
  str,
  thousandSeparator
) {
  const thousandsGroupRegex = /(\d)(?=(\d{3})+(?!\d))/g;
  let index = str.search(/[1-9]/);
  index = index === -1 ? str.length : index;
  return (
    str.substring(0, index) +
    str.substring(index, str.length).replace(thousandsGroupRegex, '$1' + thousandSeparator)
  );
}

export const numberWithCommas = (numStr, isFloat = true) => {
  numStr = String(numStr);
  const hasDecimalSeparator = numStr.indexOf('.') !== -1;
  let { beforeDecimal, afterDecimal, addNegation } = splitDecimal(numStr); // eslint-disable-line prefer-const
  beforeDecimal = applyThousandSeparator(beforeDecimal, ',');
  numStr = beforeDecimal + ((isFloat && hasDecimalSeparator && '.') || '') + (isFloat ? afterDecimal : '');
  return numStr;
}

export const pascalCase = (str) => {
  return str
    ?.split(/_/g)
    .map((word) => word.toLowerCase().charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join('_');
};

export const getCoinsArray = (coins) => {
  const highestCoinIndex = 15;
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
  for (let i = 0; i < 4; i++) {
    if (bits > 1e18) {
      bits /= 1e18;
      num++;
    }
  }
  return num;
}
export const notateNumber = (e, s) => {
  if (s === 'bits') {
    let bits = e, t = 0;
    for (let i = 0; i < 4; i++) {
      if (bits > 1e18) {
        bits /= 1e18;
        t++;
      }
    }
    return 1e4 > bits
      ? Math.floor(bits)
      : 1e5 > bits
        ? Math.floor(bits / 100) / 10 + 'K'
        : 1e6 > bits
          ? Math.floor(bits / 1e3) + 'K'
          : 1e7 > bits
            ? Math.floor(bits / 1e4) / 100 + 'M'
            : 1e8 > bits
              ? Math.floor(bits / 1e5) / 10 + 'M'
              : 1e9 > bits
                ? Math.floor(bits / 1e6) + 'M'
                : 1e10 > bits
                  ? Math.floor(bits / 1e7) / 100 + 'B'
                  : 1e11 > bits
                    ? Math.floor(bits / 1e8) / 10 + 'B'
                    : 1e12 > bits
                      ? Math.floor(bits / 1e9) + 'B'
                      : 1e13 > bits
                        ? Math.floor(bits / 1e10) / 100 + 'T'
                        : 1e14 > bits
                          ? Math.floor(bits / 1e11) / 10 + 'T'
                          : 1e15 > bits
                            ? Math.floor(bits / 1e12) + 'T'
                            : 1e16 > bits
                              ? Math.floor(bits / 1e13) / 100 + 'Q'
                              : 1e17 > bits
                                ? Math.floor(bits / 1e14) / 10 + 'Q'
                                : 1e18 > bits
                                  ? Math.floor(bits / 1e15) + 'Q'
                                  : Math.floor(bits /
                                    Math.pow(10, Math.floor(lavaLog(bits))) * 100)
                                  / 100 + 'E' + Math.floor(lavaLog(bits))
  }
  return 'Whole' === s ? (1e4 > e ? '' + Math.floor(e)
      : 1e6 > e ? Math.floor(e / 1e3) + 'K'
        : 1e7 > e ? Math.floor(e / 1e5) / 10 + 'M'
          : 1e9 > e ? Math.floor(e / 1e6) + 'M'
            : 1e10 > e ? Math.floor(e / 1e8) / 10 + 'B'
              : Math.floor(e / 1e9) + 'B')
    : 'MultiplierInfo' === s ? (0 === (10 * e) % 10 ? Math.round(e) + '.00'
        : 0 === (100 * e) % 10 ? Math.round(10 * e) / 10 + '0'
          : Math.round(100 * e) / 100 + '')
      : 'Micro' === s ? (10 < e ? '' + Math.round(e)
          : 0.1 < e ? '' + Math.round(10 * e) / 10
            : 0.01 < e ? '' + Math.round(100 * e) / 100
              : '' + Math.round(1e3 * e) / 1e3)
        : 100 > e ? ('Small' === s ? (1 > e ? '' + Math.round(100 * e) / 100
              : '' + Math.round(10 * e) / 10)
            : 'Smallish' === s ? (10 > e ? '' + Math.round(10 * e) / 10
                : '' + Math.round(e))
              : 'Smaller' === s ? (10 > e ? '' + Math.round(100 * e) / 100
                  : '' + Math.round(10 * e) / 10)
                : '' + Math.floor(e))
          : 1e3 > e ? '' + Math.floor(e)
            : 1e4 > e ? ('Bigish' === s ? '' + Math.floor(e)
                : Math.ceil(e / 10) / 100 + 'K')
              : 1e5 > e ? Math.ceil(e / 100) / 10 + 'K'
                : 1e6 > e ? Math.ceil(e / 1e3) + 'K'
                  : 1e7 > e ? Math.ceil(e / 1e4) / 100 + 'M'
                    : 1e8 > e ? Math.ceil(e / 1e5) / 10 + 'M'
                      : 1e10 > e ? Math.ceil(e / 1e6) + 'M'
                        : 1e13 > e ? Math.ceil(e / 1e9) + 'B'
                          : 1e16 > e ? Math.ceil(e / 1e12) + 'T'
                            : 1e19 > e ? Math.ceil(e / 1e15) + 'Q'
                              : 1e22 > e ? Math.ceil(e / 1e18) + 'QQ'
                                : 1e24 > e ? Math.ceil(e / 1e21) + 'QQQ'
                                  : Math.floor((e / Math.pow(10, Math.floor(lavaLog(e)))) * 100) / 100 + ('E' + Math.floor(lavaLog(e)))
}
export const commaNotation = (number) => {
  // Initialize variables
  let formattedNumber = '';
  const roundedNumberAsString = '' + Math.round(number);

  // Initialize CommaDT1 and CommaDT2

  // Calculate number of commas needed
  const numberOfCommas = Math.floor((roundedNumberAsString.length - 1) / 3) + 1;

  // Calculate number of digits after last comma
  const digitsAfterLastComma = roundedNumberAsString.length - 3 * Math.floor((roundedNumberAsString.length - 1) / 3);

  // Iterate over the number of commas and format the number
  for (let i = 0; i < numberOfCommas; i++) {
    if (i === 0) {
      formattedNumber = roundedNumberAsString.substring(0, digitsAfterLastComma);
    } else {
      formattedNumber += ',' + roundedNumberAsString.substring(digitsAfterLastComma + 3 * (i - 1), digitsAfterLastComma + 3 * i);
    }
  }

  // Return formatted number
  return formattedNumber;
}


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
  5: 'Spirited Valley'
};

const maxTimeValue = 9.007199254740992e+15;
export const getDuration = (start, end) => {
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

export const fillArrayToLength = (length, array, defaultValue = {}) => {
  return [...new Array(length)].map((item, index) => {
    return array ? array?.[index] || defaultValue : defaultValue;
  });
};

export const splitTime = (numberOfHours) => {
  const days = Math.floor(numberOfHours / 24);
  const remainder = numberOfHours % 24;
  const hours = Math.floor(remainder);
  const minutes = Math.floor(60 * (remainder - hours));
  return `${days}d:${hours}h:${minutes}m`;
};

export const randomFloatBetween = function (e, t) {
  return e <= t ? e + Math.random() * (t - e) : t + Math.random() * (e - t)
}

export const flatten = (obj, out) => {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] == 'object') {
      out = flatten(obj[key], out) //recursively call for nested
    } else {
      out[key] = obj[key] //direct assign for values
    }
  });
  return out;
}

export const sections = [{ name: 'Activity' }, { name: 'Stats' }, { name: 'Bags' }, { name: 'Obols' },
  { name: 'Obols Stats' }, { name: 'Cards' }, { name: 'Skills' }, { name: 'Prayers' }, { name: 'Talents' },
  { name: 'Equipment' }, { name: 'Star Signs' }, { name: 'Post Office' }, { name: 'Anvil Details' },
  { name: 'Inventory' },
  { name: 'Chips' },
  { name: 'Equipped Bubbles' }, { name: 'Active Skills CD' }];

export const isProd = process.env.NODE_ENV === 'production';

export const getRandomNumbersArray = (length, max) => {
  const arr = [];
  while (arr.length < length) {
    const r = Math.floor(Math.random() * max);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}
export const shouldDisplayDrawer = (pathname = '') => {
  return drawerPages.includes(pathname?.split('/').at(1))
}

export const getRealDateInMs = (ms, shouldFormat = true) => {
  const dateInMs = ms;
  if (shouldFormat) {
    return isValid(new Date(dateInMs))
      ? format(dateInMs, 'dd/MM/yyyy HH:mm:ss')
      : `${notateNumber(getTimeAsDays(dateInMs))} days`;
  }
  return dateInMs;
}

export const msToDate = (ms) => {
  // Calculate the number of hours, minutes, and seconds
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  // Format each component to be two digits
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Return the formatted string
  return `${formattedHours}h:${formattedMinutes}m:${formattedSeconds}s`;
}

export const fillMissingTalents = (arr) => {
  const talentIds = arr.map(obj => obj.talentId);
  const minTalentId = Math.min(...talentIds);
  const maxTalentId = Math.max(...talentIds);

  const missingNumbers = Array.from({ length: maxTalentId - minTalentId + 1 }, (_, i) => i + minTalentId)
    .filter(num => !talentIds.includes(num))
    .map(talentId => ({ talentId }));

  return arr.concat(missingNumbers).sort((a, b) => a.talentId - b.talentId);
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
    } else {
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
  try {
    const text = beautify ? JSON.stringify(data, null, 2) : data;
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error(err);
  }
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

export const worldsArray = ['World 1', 'World 2', 'World 3', 'World 4', 'World 5', 'World 6'];
export const prefix = isProd ? '/' : '/';

