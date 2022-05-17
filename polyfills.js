String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.firstCharLowerCase = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
}

String.prototype.toCamelCase = function () {
  return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}