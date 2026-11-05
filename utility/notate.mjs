// The game's NotateNumber, the one copy the toolbox and the wiki print through. Data-free and .mjs, so scripts/ can import
// it too; utility/helpers.js re-exports it. __test__/notateNumber.test.js walks it against the game's table.

// game: _customBlock_getLOG divides by ln(10) truncated to 2.30259, not the exact 2.302585...
// Dividing by a slightly larger number gives a slightly smaller answer, so getLOG(1e23) lands at 22.99997 and floors to 22:
// it is why the game shows Spearfish's health as 10e22 instead of 1e23.
export const GAME_LN10 = 2.30259;

export const lavaLog = (num) => {
  return Math.log(Math.max(num, 1)) / GAME_LN10;
};

// Number('1e23'), not Math.pow(10, 23). Math.pow is allowed to be imprecise and engines disagree: it turned 5e23 into
// "4.99e23" in Node. Parsing the literal is exact everywhere, so a print can't move with the reader's browser.
const pow10 = (exponent) => Number(`1e${exponent}`);

// game: "NotateNumber"
// Straight port of _customBlock_NotateNumber (N.js:68770). Every branch is a chain of `limit > e`
// tests that assumes a positive number - the game only ever notates magnitudes, so a negative falls
// through to `Math.floor(e)` and prints raw digits. Callers that can produce a signed value must
// notate `Math.abs()` and render the sign themselves.
export const notateNumber = (e, s) => {
  // The game prints NaNEInfinity here (a Bits bubble's cost overflows past ~Lv 1000).
  if (e === Infinity) return '∞';
  if (s === 'bits' || s === 'Bits') {
    let bits = e, t = 0;
    for (let i = 0; i < 5; i++) {
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
                                    pow10(Math.floor(lavaLog(bits))) * 100)
                                  / 100 + 'e' + Math.floor(lavaLog(bits))
  }
  return 'Whole' === s ? (1e4 > e ? '' + Math.floor(e)
    : 1e6 > e ? Math.floor(e / 1e3) + 'K'
      : 1e7 > e ? Math.floor(e / 1e5) / 10 + 'M'
        : 1e9 > e ? Math.floor(e / 1e6) + 'M'
          : 1e10 > e ? Math.floor(e / 1e8) / 10 + 'B'
            : Math.floor(e / 1e9) + 'B')
    : 'MultiplierInfo' === s ? (1e6 < e
      ? (0 === Math.round((e / 1e6) * 100) % 100 ? Math.round(e / 1e6) + '.00M'
        : 0 === Math.round((e / 1e6) * 100) % 10 ? Math.round((e / 1e6) * 10) / 10 + '0M'
          : Math.round((e / 1e6) * 100) / 100 + 'M')
      : 0 === Math.round(100 * e) % 100 ? Math.round(e) + '.00'
        : 0 === Math.round(100 * e) % 10 ? Math.round(10 * e) / 10 + '0'
          : Math.round(100 * e) / 100 + '')
      : 'ThreeDecimals' === s ? '' + parseFloat((Math.round(1000 * e) / 1000).toFixed(3))
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
                        : 1e9 > e ? Math.ceil(e / 1e6) + 'M'
                          : 1e10 > e ? Math.ceil(e / 1e7) / 100 + 'B'
                            : 1e11 > e ? Math.ceil(e / 1e8) / 10 + 'B'
                              : 1e12 > e ? Math.ceil(e / 1e9) + 'B'
                                : 1e13 > e ? Math.ceil(e / 1e10) / 100 + 'T'
                                  : 1e14 > e ? Math.ceil(e / 1e11) / 10 + 'T'
                                    : 1e15 > e ? Math.ceil(e / 1e12) + 'T'
                                      : 1e16 > e ? Math.ceil(e / 1e13) / 100 + 'Q'
                                        : 1e17 > e ? Math.ceil(e / 1e14) / 10 + 'Q'
                                          : 1e18 > e ? Math.ceil(e / 1e15) + 'Q'
                                            : 1e19 > e ? Math.ceil(e / 1e16) / 100 + 'QQ'
                                              : 1e20 > e ? Math.ceil(e / 1e17) / 10 + 'QQ'
                                                : 1e21 > e ? Math.ceil(e / 1e18) + 'QQ'
                                                  : 'TinyE' === s
                                      ? '' + Math.floor(e / pow10(Math.floor(lavaLog(e))) * 10) / 10 + ('e' + Math.floor(lavaLog(e)))
                                      // 2.3.540: the default exponent is a lowercase 'e'; 'LargeE' keeps the old 'E'
                                      : '' + Math.floor(e / pow10(Math.floor(lavaLog(e))) * 100) / 100 + (('LargeE' === s ? 'E' : 'e') + Math.floor(lavaLog(e)))
}

// notateNumber rounds up like the game, so 9,997,104 of a 10M target would read as 10M / 10M.
// A progress amount floors to the three digits the ladder shows first.
export const notateProgress = (n) => {
  if (!Number.isFinite(n) || n < 1e3) return notateNumber(n);
  const step = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  return notateNumber(Math.floor(n / step) * step);
};
