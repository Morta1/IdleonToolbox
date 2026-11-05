import { primaryColumn, secondaryColumn } from '@components/common/DataTable/layout';
import { formatNum, notateNumber } from '@utility/helpers';
import { formatAmount } from '@utility/wiki/effects.mjs';
import { notateAmount, notateGame } from '@utility/wiki/notate';
import { NO_MAX, isNumericColumn } from '@utility/wiki/listing-sort.mjs';
import { gameGlyphs, shownName } from '@utility/wiki/game-glyphs.mjs';
import { coinsOf } from './CoinAmount';

// How wide the box around a listing must be for each of its columns, read off the list's own text, so the columns follow
// the room beside the rail through container queries: the same CSS on the build machine and every visitor's, and nothing
// to measure after mount. A column that doesn't fit waits in the row's Details: a word never breaks to make room.

// Roboto at 14 px, each group a little over its widest letter: too wide only sends a column to Details a step early.
const CHAR_GROUPS = [[3.8, 'iljI.,:;\'!|'], [5, 'trf() -'], [13, 'mwMW%@'], [9.6, 'ABCDEFGHJKLNOPQRSTUVXYZ']];
const CHAR_WIDTH = new Map(CHAR_GROUPS.flatMap(([width, chars]) => [...chars].map((char) => [char, width])));
const OTHER_CHAR = 7.9;
// Items is 2,420 names, read on every visit: no regex per letter.
const textWidth = (text) => {
  let width = 0;
  for (const char of String(text ?? '')) width += CHAR_WIDTH.get(char) ?? OTHER_CHAR;
  return width;
};
const longestWord = (text) => Math.max(0, ...String(text ?? '').split(/[\s-]+/).map(textWidth));

// A cell's 12 px a side; a row's 32 px art and its 10 px gap; the Details chevron; a coin or a gem and the gap to its number.
const PADDING = 24;
const ART = 42;
const CHEVRON = 40;
const COIN = 18;
const COIN_GAP = 6;
const CURRENCY_ART = 20;
const PLUS = 18;
// A column heading is 12 px caps, the sort arrow 26 px beside it, the i 20.
const HEAD_SCALE = 0.86;
const SORT_ARROW = 26;
const NOTE = 20;
// A sentence's column: about 300 px, less when its longest fits on one line, more for one that would still stack past
// this many lines. A name's the same lines.
const EFFECT = 300;
const MAX_LINES = 4;
// A phone's row stays its name and one column: the rest join from here, which no phone's box reaches.
const PHONE_ROW = 450;

const headWidth = ({ label, type, sortable, note }) => {
  const caps = String(label).toUpperCase();
  const numeric = isNumericColumn({ type });
  // DataTable keeps a short number heading on one line; any other wraps between words.
  const words = numeric && caps.trim().split(/\s+/).length <= 2 ? textWidth(caps) : longestWord(caps);
  return words * HEAD_SCALE + (sortable ? SORT_ARROW : 0) + (note ? NOTE : 0);
};

const coinsWidth = (amount) => {
  const coins = coinsOf(amount);
  return coins.reduce((sum, [, quantity]) => sum + COIN + textWidth(notateAmount(quantity)) * HEAD_SCALE, 0) + COIN_GAP * Math.max(0, coins.length - 1);
};

const amountWidth = (amount) => textWidth(Math.abs(amount) >= 1e6 ? notateNumber(amount, 'Big') : formatAmount(amount));

// Coins wrap between tiers, so at the least they take half their row.
const costWidth = ({ amount, currency, icon }) => {
  if (currency === 'Coins' && Number.isFinite(amount)) return coinsWidth(amount) / 2;
  return amountWidth(amount) + (icon ? CURRENCY_ART : currency ? textWidth(` ${String(currency).replace(/_/g, ' ')}`) : 0);
};

const numberWidth = (value, format) => {
  if (format === 'coins') return coinsWidth(value);
  if (format === 'gems' || format === 'crystals') return CURRENCY_ART + textWidth(notateAmount(value));
  if (format === 'cost') return amountWidth(value);
  if (format === 'usd') return textWidth(formatNum(value, 'price'));
  if (format === 'notate') return textWidth(notateGame(value) ?? '');
  if (format === 'amount') return textWidth(value >= 1e9 ? notateAmount(value) : formatAmount(value));
  return textWidth(notateAmount(value));
};

// What a column needs of its width: hold, the least it takes, and full, what its cells take on one line.
const columnWidths = (column, at, entries, labelOf) => {
  const head = headWidth(column);
  const cells = entries.map((entry) => entry.cells?.[at]).filter((value) => value != null);
  const widest = (widthOf) => Math.max(0, ...cells.map(widthOf));
  if (column.type === 'effect') {
    const line = widest((value) => textWidth(gameGlyphs(value)));
    const hold = Math.max(head, Math.min(EFFECT, line), line / MAX_LINES);
    return { hold, full: hold };
  }
  if (column.type === 'cost') {
    // One cost per line at the least; every cost of a row on one line only where the row holds it.
    const piece = widest((costs) => Math.max(...costs.map(costWidth)));
    const line = widest((costs) => costs.reduce((sum, cost) => sum + costWidth(cost), PLUS * (costs.length - 1)));
    return { hold: Math.max(head, piece), full: Math.max(head, line) };
  }
  if (column.type === 'facet' || column.type === 'text') {
    const words = (value) => (column.type === 'facet' ? labelOf(value) : gameGlyphs(value));
    const hold = Math.max(head, widest((value) => longestWord(words(value))), widest((value) => textWidth(words(value))) / 2);
    return { hold, full: hold };
  }
  if (column.format === 'coins') {
    const hold = Math.max(head, widest((value) => coinsWidth(value)) / 2);
    return { hold, full: hold };
  }
  if (column.type === 'max') {
    const hold = Math.max(head, widest((value) => (value === NO_MAX ? textWidth('No max') : textWidth(notateAmount(value)))));
    return { hold, full: hold };
  }
  const hold = Math.max(head, widest((value) => numberWidth(value, column.format)));
  return { hold, full: hold };
};

// at[i]: the box width from which column i joins the row, the primary first, then the secondary and the rest in the
// list's order, a sentence last: it takes the most and every number fits beside the name without it. holds: the least
// the name and a sentence take, as a table's own layout would squeeze them to their longest word. everyColumn: where the
// last one joins, so the headers can do the sorting. costOnOneLine: where a row's costs stop wrapping.
export const listingRooms = ({ columns, entries, labelOf, sort }) => {
  const data = columns.map((column) => ({ key: column.key, numeric: isNumericColumn(column) }));
  const primary = primaryColumn(data, sort);
  const secondary = secondaryColumn(data, primary);
  const widths = columns.map((column, at) => columnWidths(column, at, entries, labelOf));
  const art = entries.some((entry) => entry.node?.icon) ? ART : 0;
  const names = entries.map((entry) => `${shownName(entry.label)} ${entry.disambig ?? ''}`.trim());
  const nameHold = Math.max(...names.map(longestWord), ...names.map((name) => textWidth(name) / MAX_LINES), 0);

  const queue = [primary, secondary, ...columns.keys()].filter((at, index, all) => at >= 0 && all.indexOf(at) === index);
  const order = [...queue.filter((at) => columns[at].type !== 'effect'), ...queue.filter((at) => columns[at].type === 'effect')];
  const roomAt = [];
  let used = PADDING + art + Math.ceil(nameHold);
  order.forEach((at, step) => {
    used += PADDING + Math.ceil(widths[at].hold);
    const room = used + (step < order.length - 1 ? CHEVRON : 0);
    roomAt[at] = at === primary ? room : Math.max(room, PHONE_ROW);
  });
  const everyColumn = Math.max(0, ...roomAt);
  const costAt = columns.findIndex((column) => column.type === 'cost');
  const holdSx = (width) => ({ content: '""', display: 'block', height: 0, width: Math.ceil(width) });
  return {
    at: roomAt,
    everyColumn,
    costOnOneLine: costAt < 0 ? everyColumn : Math.ceil(everyColumn + widths[costAt].full - widths[costAt].hold),
    holds: {
      '& th.name::after': holdSx(art + nameHold),
      ...Object.fromEntries(columns.flatMap((column, at) => (column.type === 'effect' || column.format === 'coins' || column.type === 'cost'
        ? [[`& th.col-${at}::after`, holdSx(widths[at].hold)]]
        : [])))
    }
  };
};
