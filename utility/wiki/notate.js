// The game's number formatter on a wiki page. The wiki was printing raw values with thousands separators, which is both
// unlike the game and, past 2^53, actively wrong: Spearfish's MonsterHPTotal is 1e23, and numberWithCommas rendered that
// as 99,999,999,999,999,991,611,392.
import { formatNum } from '@utility/helpers';
import { notateNumber } from '../notate.mjs';

// A missing or non-finite value has nothing to show.
export const notateGame = (value, mode = 'Big') => (value == null || !Number.isFinite(value) ? '' : String(notateNumber(value, mode)));

// A game amount on a wiki page, on the site's rule: below 1M the decimals it has, from 1M the game's Big. A quantity's "x"
// stays with its caller.
export const notateAmount = (value) => (value == null || !Number.isFinite(value) ? '' : formatNum(value));
