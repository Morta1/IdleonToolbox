import "core-js/actual/array/to-spliced";
import "core-js/actual/array/to-sorted";
import "core-js/actual/array/find-last";
import 'core-js/actual/string/starts-with';
import 'core-js/actual/structured-clone';

String.prototype.capitalize = function () {
  if (!this) return '';
  return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.camelToTitleCase = function () {
  if (!this) return '';
  const str = String(this).replace(/([A-Z0-9"])/g, ' $1');
  return str.charAt(0).toUpperCase() + str.slice(1);
};

String.prototype.capitalizeAllWords = function () {
  return this.replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
};

String.prototype.capitalizeAll = function () {
  if (!this) return '';
  return this.split('_').map((word) => word.capitalize()).join('_');
}

String.prototype.firstCharLowerCase = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
}

String.prototype.toCamelCase = function () {
  return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

Array.prototype.toSimpleObject = function (val = true) {
  return this.reduce((res, el) => {
    return { ...res, [el]: val };
  }, {});
}

Array.prototype.toObjectByIndex = function () {
  return Object.entries(this).reduce((res, [key, val]) => {
    return { ...res, [key]: val };
  }, {});
}

Array.prototype.toChunks = function (perChunk) {
  return this.reduce((all, one, i) => {
    const ch = Math.floor(i / perChunk);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, []);
}

Date.prototype.stdTimezoneOffset = function () {
  const jan = new Date(this.getFullYear(), 0, 1);
  const jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
}