// The game's own number formatter, transcribed from N.js `_customBlock_NotateNumber(e, t)`
// (ActorEvents_124). The wiki was printing raw values with thousands separators, which is both
// unlike the game and, past 2^53, actively wrong: Spearfish's MonsterHPTotal is 1e23, and
// numberWithCommas rendered that as 99,999,999,999,999,991,611,392.
//
// Only the modes the wiki needs are here. The game also has Bits, Whole, MultiplierInfo, Micro,
// Smallish, Smaller, Bigish and TinyE, which nothing on these pages uses.
import GAME from './game-constants.mjs';

// The game's ladder (GAME.notateNumber big, the NotateNumber default arm) is ceil-based, not
// round-based, and the divisor changes at every power of ten rather than every three, which is
// what gives 1.25M rather than 1.3M.
const rung = (e, { divisor, scale, suffix }) => `${Math.ceil(e / divisor) / scale}${suffix}`;

// The game's own log, `_customBlock_getLOG`: Math.log(max(e, 1)) / 2.30259 (GAME.gameLog).
//
// That divisor is ln(10) TRUNCATED (the real value is 2.302585093...). Dividing by a slightly
// larger number gives a slightly smaller answer, so getLOG(1e23) lands at 22.99997 and floors to
// 22 rather than 23. This is not a rounding curiosity: it is why the game shows Spearfish's health
// as 10E22 instead of 1E23. Math.log10 here would disagree with the game on every exact power of
// ten past 1e21, so the game's own divisor is used.
const gameLog = (value) => (GAME.gameLog ? Math.log(Math.max(value, 1)) / GAME.gameLog.divisor : null);

// Number('1e23'), not Math.pow(10, 23). Math.pow is allowed to be imprecise and the two engines
// genuinely disagree: Math.pow(10, 23) === 1e23 is true in the game's V8 and false in Node's,
// which turned 5e23 into "4.99E23" here and "5E23" in the game. Parsing the literal is exact
// everywhere, so the wiki cannot drift from the game depending on the reader's browser.
const pow10 = (exponent) => Number(`1e${exponent}`);

// Past the ladder the game switches to its own mantissa-and-exponent form.
const exponential = (value) => {
  const log = gameLog(value);
  if (log === null) return null;
  const exponent = Math.floor(log);
  const mantissa = Math.floor((value / pow10(exponent)) * 100) / 100;
  return `${mantissa}E${exponent}`;
};

// null when the game data lacks the table it needs (a game patch the locator no longer matches).
export const notateGame = (value, mode = 'Big') => {
  if (value == null || !Number.isFinite(value)) return '';
  const table = GAME.notateNumber;
  if (!table) return null;
  const { small, big } = table;
  const e = value;

  if (e < small.tenthsBelow) {
    if (mode === 'Small') return String(e < small.hundredthsBelow ? Math.round(100 * e) / 100 : Math.round(10 * e) / 10);
    return String(Math.floor(e));
  }
  if (e < small.floorBelow) return String(Math.floor(e));

  const step = big.find(({ below }) => e < below);
  return step ? rung(e, step) : exponential(e);
};
