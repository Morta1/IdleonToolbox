// The game's own number formatter, transcribed from N.js `_customBlock_NotateNumber(e, t)`
// (ActorEvents_124). The wiki was printing raw values with thousands separators, which is both
// unlike the game and, past 2^53, actively wrong: Spearfish's MonsterHPTotal is 1e23, and
// numberWithCommas rendered that as 99,999,999,999,999,991,611,392.
//
// Only the modes the wiki needs are here. The game also has Bits, Whole, MultiplierInfo, Micro,
// Smallish, Smaller, Bigish and TinyE, which nothing on these pages uses.

// The game's ladder is ceil-based, not round-based, and the divisor changes at every power of ten
// rather than every three, which is what gives 1.25M rather than 1.3M.
const LADDER = [
  [1e4, (e) => Math.ceil(e / 10) / 100, 'K'],
  [1e5, (e) => Math.ceil(e / 100) / 10, 'K'],
  [1e6, (e) => Math.ceil(e / 1e3), 'K'],
  [1e7, (e) => Math.ceil(e / 1e4) / 100, 'M'],
  [1e8, (e) => Math.ceil(e / 1e5) / 10, 'M'],
  [1e9, (e) => Math.ceil(e / 1e6), 'M'],
  [1e10, (e) => Math.ceil(e / 1e7) / 100, 'B'],
  [1e11, (e) => Math.ceil(e / 1e8) / 10, 'B'],
  [1e12, (e) => Math.ceil(e / 1e9), 'B'],
  [1e13, (e) => Math.ceil(e / 1e10) / 100, 'T'],
  [1e14, (e) => Math.ceil(e / 1e11) / 10, 'T'],
  [1e15, (e) => Math.ceil(e / 1e12), 'T'],
  [1e16, (e) => Math.ceil(e / 1e13) / 100, 'Q'],
  [1e17, (e) => Math.ceil(e / 1e14) / 10, 'Q'],
  [1e18, (e) => Math.ceil(e / 1e15), 'Q'],
  [1e19, (e) => Math.ceil(e / 1e16) / 100, 'QQ'],
  [1e20, (e) => Math.ceil(e / 1e17) / 10, 'QQ'],
  [1e21, (e) => Math.ceil(e / 1e18), 'QQ']
];

// The game's own log, `_customBlock_getLOG`: Math.log(max(e, 1)) / 2.30259.
//
// That divisor is ln(10) TRUNCATED (the real value is 2.302585093...). Dividing by a slightly
// larger number gives a slightly smaller answer, so getLOG(1e23) lands at 22.99997 and floors to
// 22 rather than 23. This is not a rounding curiosity: it is why the game shows Spearfish's health
// as 10E22 instead of 1E23. Math.log10 here would disagree with the game on every exact power of
// ten past 1e21, so the constant is reproduced exactly.
const gameLog = (value) => Math.log(Math.max(value, 1)) / 2.30259;

// Number('1e23'), not Math.pow(10, 23). Math.pow is allowed to be imprecise and the two engines
// genuinely disagree: Math.pow(10, 23) === 1e23 is true in the game's V8 and false in Node's,
// which turned 5e23 into "4.99E23" here and "5E23" in the game. Parsing the literal is exact
// everywhere, so the wiki cannot drift from the game depending on the reader's browser.
const pow10 = (exponent) => Number(`1e${exponent}`);

// Past 1e21 the game switches to its own mantissa-and-exponent form.
const exponential = (value) => {
  const exponent = Math.floor(gameLog(value));
  const mantissa = Math.floor((value / pow10(exponent)) * 100) / 100;
  return `${mantissa}E${exponent}`;
};

export const notateGame = (value, mode = 'Big') => {
  if (value == null || !Number.isFinite(value)) return '';
  const e = value;

  if (e < 100) {
    if (mode === 'Small') return String(e < 1 ? Math.round(100 * e) / 100 : Math.round(10 * e) / 10);
    return String(Math.floor(e));
  }
  if (e < 1e3) return String(Math.floor(e));

  for (const [limit, scale, suffix] of LADDER) {
    if (e < limit) return `${scale(e)}${suffix}`;
  }
  return exponential(e);
};
