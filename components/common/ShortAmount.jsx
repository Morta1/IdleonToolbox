import React from 'react';
import { formatNum, notateNumber } from '@utility/helpers';
import { DottedValue } from '@components/common/InfoButton';
import { formatAmount } from '@utility/wiki/format-amount.mjs';

// From a million up the digits stop being comparable at a glance, so an amount reads in the game's own notation
// ("45.5M", ceil-based like the game's) under a dotted underline whose note is the exact amount: a hover previews
// it, a click or a tap pins it (Info board, a value with a dotted underline).
// Both helpers are data-free: the wiki's notateGame and effects.mjs would ship the wiki's client tables to app pages.
const SHORT_FROM = 1e6;
// Exact digits only while they are exact: past 2^53 a float's digits are noise, so the note goes scientific with four
// significant digits, rounded as the short number's Big rounds: up from K to QQ ("151QQ" opens "1.501e20", never
// "1.500e20"), down in its e-notation from 1e21. The 1e-9 keeps a division's last-bit noise (7.77e22 / 1e19 is
// 7770.000000000001) from moving a digit.
const EXACT_BELOW = Number.MAX_SAFE_INTEGER;
const scientific = (amount) => {
  const magnitude = Math.abs(amount);
  const round = magnitude < 1e21 ? (value) => Math.ceil(value - 1e-9) : (value) => Math.floor(value + 1e-9);
  let exponent = Math.floor(Math.log10(magnitude));
  const digitsAt = () => round(magnitude / 10 ** (exponent - 3));
  let digits = digitsAt();
  // log10 can land a hair past a power of ten, or the rounding carry into a fifth digit
  if (digits < 1e3) {
    exponent -= 1;
    digits = digitsAt();
  }
  if (digits >= 1e4) {
    exponent += 1;
    digits = round(digits / 10);
  }
  const text = String(digits);
  return `${amount < 0 ? '-' : ''}${text[0]}.${text.slice(1)}e${exponent}`;
};
const exactText = (amount) => (Math.abs(amount) < EXACT_BELOW ? formatNum(Math.round(amount), 'exact') : scientific(amount));

const ShortAmount = ({ amount }) => {
  const short = Number.isFinite(amount) && Math.abs(amount) >= SHORT_FROM ? notateNumber(amount, 'Big') : null;
  if (!short) return formatAmount(amount);
  return <DottedValue note={exactText(amount)} label={`${short}, exact amount`}>{short}</DottedValue>;
};

export default ShortAmount;
