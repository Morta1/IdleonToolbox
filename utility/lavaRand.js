let Bf = {}
Bf._mul = Math.imul;
const z = {}
var jc = function(e) {
  this.init(e);
};
((z.Rand = jc),
  (jc.__name__ = "Rand"),
  (jc.hash = function(e, t) {
    return (null == t && (t = 5381), (e = Bf._mul(e, -862048943)), (t ^= e = Bf._mul((e << 15) | (e >>> 17), 461845907)), (t = (Bf._mul((t << 13) | (t >>> 19), 5) + -430675100) | 0), (t = Bf._mul(t ^ (t >> 16), -2048144789)), (t = Bf._mul(t ^ (t >> 13), -1028477387)) ^ (t >> 16));
  }),
  (jc.inlineHash = function(e, t) {
    return ((e = Bf._mul(e, -862048943)), (t ^= e = Bf._mul((e << 15) | (e >>> 17), 461845907)), (t = (Bf._mul((t << 13) | (t >>> 19), 5) + -430675100) | 0), (t = Bf._mul(t ^ (t >> 16), -2048144789)), (t = Bf._mul(t ^ (t >> 13), -1028477387)) ^ (t >> 16));
  }),
  (jc.prototype = {
    seed: null,
    seed2: null,
    init: function(e) {
      ((this.seed = e), (this.seed2 = jc.hash(e)), 0 == this.seed && (this.seed = 1), 0 == this.seed2 && (this.seed2 = 1));
    },
    random: function(e) {
      return ((this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), (1073741823 & (((this.seed << 16) + this.seed2) | 0)) % e);
    },
    shuffle: function(e) {
      for (var t = e.length, i = 0; i < t;) {
        (i++, (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)));
        var n = (1073741823 & (((this.seed << 16) + this.seed2) | 0)) % t;
        ((this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)));
        var a = (1073741823 & (((this.seed << 16) + this.seed2) | 0)) % t,
          s = e[n];
        ((e[n] = e[a]), (e[a] = s));
      }
    },
    rand: function() {
      return ((this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), ((1073741823 & (((this.seed << 16) + this.seed2) | 0)) % 10007) / 10007);
    },
    srand: function(e) {
      return (null == e && (e = 1), (this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), (((((this.seed << 16) + this.seed2) | 0) % 10007) / 10007) * e);
    },
    int: function() {
      return ((this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), ((this.seed << 16) + this.seed2) | 0);
    },
    uint: function() {
      return ((this.seed = 36969 * (65535 & this.seed) + (this.seed >> 16)), (this.seed2 = 18e3 * (65535 & this.seed2) + (this.seed2 >> 16)), 1073741823 & (((this.seed << 16) + this.seed2) | 0));
    },
    __class__: jc
  }));
export default jc;