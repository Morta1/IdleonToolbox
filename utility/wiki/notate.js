// The game's number formatter on a wiki page. The wiki was printing raw values with thousands separators, which is both
// unlike the game and, past 2^53, actively wrong: Spearfish's MonsterHPTotal is 1e23, and numberWithCommas rendered that
// as 99,999,999,999,999,991,611,392.
import { notateNumber } from '../notate.mjs';
import { formatNumber } from './format-amount.mjs';

// A missing or non-finite value has nothing to show.
export const notateGame = (value, mode = 'Big') => (value == null || !Number.isFinite(value) ? '' : String(notateNumber(value, mode)));

// A game amount on a wiki page, as the game prints it (Big: 1.46K, 2.4M), the way the item cards print costs.
// Below 1,000 the game floors, so a fraction there (a drop's 0.5) keeps its digits instead of reading 0.
export const notateAmount = (value) => (Math.abs(value) < 1000 && !Number.isInteger(value) ? formatNumber(value) : notateGame(value));
