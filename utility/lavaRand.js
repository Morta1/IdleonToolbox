let Af = {}
Af._mul = Math.imul;
const x = {}

var Ub = function(e) {
  this.init(e);
};
(x.Rand = Ub),
(Ub.__name__ = "Rand"),
(Ub.hash = function(e, t) {
  return null == t && (t = 5381), (e = Af._mul(e, -862048943)), (t ^= e = Af._mul((e << 15) | (e >>> 17), 461845907)), (t = (Af._mul((t << 13) | (t >>> 19), 5) + -430675100) | 0), (t = Af._mul(t ^ (t >> 16), -2048144789)), (t = Af._mul(t ^ (t >> 13), -1028477387)) ^ (t >> 16);
}),
(Ub.inlineHash = function(e, t) {
  return (e = Af._mul(e, -862048943)), (t ^= e = Af._mul((e << 15) | (e >>> 17), 461845907)), (t = (Af._mul((t << 13) | (t >>> 19), 5) + -430675100) | 0), (t = Af._mul(t ^ (t >> 16), -2048144789)), (t = Af._mul(t ^ (t >> 13), -1028477387)) ^ (t >> 16);
}),
(Ub.prototype = {
  seed: null,
  seed2: null,
  init: function(e) {
    (this.seed = e), (this.seed2 = Ub.hash(e)), 0 == this.seed && (this.seed = 1), 0 == this.seed2 && (this.seed2 = 1);
  },
  random: function(e) {
    return (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), (1073741823 & (((this.seed << 16) + this.seed2) | 0)) % e;
  },
  shuffle: function(e) {
    for (var t = e.length, n = 0; n < t;) {
      n++, (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16));
      var a = (1073741823 & (((this.seed << 16) + this.seed2) | 0)) % t;
      (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16));
      var i = (1073741823 & (((this.seed << 16) + this.seed2) | 0)) % t,
        s = e[a];
      (e[a] = e[i]), (e[i] = s);
    }
  },
  rand: function() {
    return (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), ((1073741823 & (((this.seed << 16) + this.seed2) | 0)) % 10007) / 10007;
  },
  srand: function(e) {
    return null == e && (e = 1), (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), (((((this.seed << 16) + this.seed2) | 0) % 10007) / 10007) * e;
  },
  int: function() {
    return (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), ((this.seed << 16) + this.seed2) | 0;
  },
  uint: function() {
    return (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), 1073741823 & (((this.seed << 16) + this.seed2) | 0);
  },
  __class__: Ub
});
export default Ub;