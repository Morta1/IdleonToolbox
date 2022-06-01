String.prototype.capitalize = function () {
  if (!this) return '';
  return this.charAt(0).toUpperCase() + this.slice(1);
}

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

Array.prototype.toChunks = function (perChunk) {
  return this.reduce((all, one, i) => {
    const ch = Math.floor(i / perChunk);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, []);
}