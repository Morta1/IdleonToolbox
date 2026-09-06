import '../../polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BOARD_SIZE,
  BOARD_X,
  BOARD_Y,
  countBoardCharacters,
  getAffectedIndexes,
  getBoardAtStep,
  optimizeArrayWithSwaps,
  optimizeSwapCurve,
  bestValuePlan,
  curvePlans,
  WEIGHTED_STAT,
  WEIGHTED_STAT_KEYS
} from '@parsers/world-3/construction';

export const SEEDS = [1, 2, 3, 4, 5];

const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const useSeed = (seed) => vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));

beforeEach(() => useSeed(SEEDS[0]));
afterEach(() => vi.restoreAllMocks());

const slotToXY = (index) => ({ x: index % BOARD_X, y: (BOARD_Y - 1) - Math.floor(index / BOARD_X) });

// Independent re-implementation of the board totals, kept deliberately naive so it catches drift
// between the fast scorer and the decorated board the optimizer hands back.
const referenceTotals = (board, characters) => {
  const buildBoost = new Array(BOARD_SIZE).fill(0);
  const flaggyBoost = new Array(BOARD_SIZE).fill(0);
  const playerExpBoost = new Array(BOARD_SIZE).fill(0);

  board.forEach((slot, index) => {
    const stats = slot?.cog?.stats || {};
    if (typeof stats.h !== 'string') return;
    const { x, y } = slotToXY(index);
    getAffectedIndexes({ stats }, x, y)
      .filter(([tx, ty]) => tx >= 0 && ty >= 0 && tx < BOARD_X && ty < BOARD_Y)
      .forEach(([tx, ty]) => {
        const target = (BOARD_Y - 1 - ty) * BOARD_X + tx;
        buildBoost[target] += stats?.e?.value || 0;
        flaggyBoost[target] += stats?.g?.value || 0;
        playerExpBoost[target] += stats?.f?.value || 0;
      });
  });

  let totalBuildRate = 0, totalExpRate = 0, totalFlaggyRate = 0, playerExp = 0;
  board.forEach((slot, index) => {
    const stats = slot?.cog?.stats || {};
    totalBuildRate += Math.max((stats?.a?.value || 0) * (1 + buildBoost[index] / 100), 0);
    totalFlaggyRate += Math.max((stats?.c?.value || 0) * (1 + flaggyBoost[index] / 100), 0);
    totalExpRate += stats?.d?.value || 0;
    if (slot?.cog?.name?.includes('Player_')) {
      const character = characters?.find(({ name }) => name === slot.cog.name.replace('Player_', ''));
      const base = character?.constructionExpPerHour ?? stats?.b?.value ?? 0;
      playerExp += base * (1 + playerExpBoost[index] / 100);
    }
  });
  return {
    totalBuildRate,
    totalExpRate,
    totalFlaggyRate,
    totalPlayerExpRate: playerExp * (1 + totalExpRate / 100)
  };
};

const makeSlot = (index, stats, name = `Cog${index}`) => ({
  currentAmount: 1,
  requiredAmount: 1,
  flagPlaced: false,
  cog: { name, stats, originalIndex: index }
});

const shapes = ['adjacent', 'diagonal', 'row', 'column', 'up', 'down', 'left', 'right', 'corners', 'around'];

const makeBoard = () => {
  const board = [];
  for (let index = 0; index < BOARD_SIZE; index++) {
    if (index % 5 === 0) {
      board.push(makeSlot(index, {
        e: { name: '%_Build_Rate', value: 10 + (index % 7) * 5 },
        g: { name: '%_Flaggy_Rate', value: 5 },
        f: { name: '%_Player_Construct_XP', value: 4 },
        h: shapes[index % shapes.length]
      }));
    } else if (index % 11 === 0) {
      board.push(makeSlot(index, {
        b: { name: '_Construct_Exp/HR', value: 500 },
        a: { name: '_Build_Rate/HR', value: 40 }
      }, `Player_Char${index}`));
    } else {
      board.push(makeSlot(index, {
        a: { name: '_Build_Rate/HR', value: 50 + index },
        c: { name: '_Flaggy_Rate/HR', value: 3 },
        d: { name: '%_Bonus_Construct_EXP', value: 1 }
      }));
    }
  }
  return board;
};

const characters = Array.from({ length: 10 }, (_, i) => ({
  name: `Char${i * 11}`,
  constructionExpPerHour: 1000 + i * 100
}));

describe('construction board scoring', () => {
  it('reports the same totals as an independent implementation', () => {
    const board = makeBoard();
    const result = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const reference = referenceTotals(board, characters);

    expect(result.totalBuildRate).toBeCloseTo(reference.totalBuildRate, 6);
    expect(result.totalExpRate).toBeCloseTo(reference.totalExpRate, 6);
    expect(result.totalFlaggyRate).toBeCloseTo(reference.totalFlaggyRate, 6);
    expect(result.totalPlayerExpRate).toBeCloseTo(reference.totalPlayerExpRate, 6);
  });

  it('scores the optimized board consistently with the board it returns', () => {
    const board = makeBoard();
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 40000, characters });
    // Rebuild plain slots from the optimized placement and re-score them from scratch.
    const replayed = optimized.board.map((slot) => {
      const original = [...board, ...[]].find((base) => base.cog.originalIndex === slot.cog.originalIndex);
      return { ...slot, cog: original.cog };
    });
    expect(optimized.totalBuildRate).toBeCloseTo(referenceTotals(replayed, characters).totalBuildRate, 6);
  });
});

describe('optimizeArrayWithSwaps', () => {
  it('never returns a board worse than the starting one', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 64000, characters });
    expect(optimized.totalBuildRate).toBeGreaterThanOrEqual(baseline.totalBuildRate);
  });

  it('improves the target stat on a deliberately bad layout', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 120000, characters });
    expect(optimized.totalBuildRate).toBeGreaterThan(baseline.totalBuildRate);
  });

  it('optimizes player exp rate against real character exp values', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalPlayerExpRate', time: 0, characters });
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalPlayerExpRate', maxIterations: 120000, characters });
    expect(baseline.totalPlayerExpRate).toBeGreaterThan(0);
    expect(optimized.totalPlayerExpRate).toBeGreaterThan(baseline.totalPlayerExpRate);
  });

  it('pulls a strong spare cog in from the inventory', () => {
    const board = makeBoard();
    const spare = {
      name: 'CogInventory',
      stats: { a: { name: '_Build_Rate/HR', value: 1e6 } },
      originalIndex: 150
    };
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 120000, characters, spareCogs: [spare] });
    const placed = optimized.board.some(({ cog }) => cog?.originalIndex === 150);
    expect(placed).toBe(true);
    expect(optimized.totalBuildRate).toBeGreaterThan(1e6);
  });

  it('leaves locked and flag-building slots untouched', () => {
    const board = makeBoard();
    board[3] = { ...board[3], currentAmount: 0, requiredAmount: 100 };
    board[7] = { ...board[7], flagPlaced: true };
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 80000, characters });
    expect(optimized.board[3].cog.originalIndex).toBe(3);
    expect(optimized.board[7].cog.originalIndex).toBe(7);
  });

  it('respects a zero weight, behaving like the single-stat run', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const buildOnly = optimizeArrayWithSwaps(board, {
      stat: WEIGHTED_STAT,
      weights: { totalBuildRate: 1, totalPlayerExpRate: 0, totalFlaggyRate: 0 },
      maxIterations: 120000,
      characters
    });
    expect(buildOnly.totalBuildRate).toBeGreaterThan(baseline.totalBuildRate);
  });

  it('trades a single stat away for a better balance across all three', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const buildOnly = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 160000, characters });
    const balanced = optimizeArrayWithSwaps(board, {
      stat: WEIGHTED_STAT,
      weights: { totalBuildRate: 1, totalPlayerExpRate: 1, totalFlaggyRate: 1 },
      maxIterations: 160000,
      characters
    });

    // The guarantee is on the composite objective, not on each component - a weighted run is
    // free to give up ground on one stat to gain more on the others.
    const composite = (totals) => WEIGHTED_STAT_KEYS
      .reduce((score, key) => score + (totals[key] / Math.max(baseline[key], 1e-6)) / WEIGHTED_STAT_KEYS.length, 0);
    // Only this one is a hard guarantee: the run improves the thing it optimizes.
    expect(composite(balanced)).toBeGreaterThan(composite(baseline));
    expect(buildOnly.totalBuildRate).toBeGreaterThan(baseline.totalBuildRate);

    // The next two compare two independent randomised searches, so they get a small tolerance -
    // asserting a strict win makes the test flaky without making it any more meaningful.
    const TOLERANCE = 0.02;
    // A balanced run should beat a build-only run on the stats build-only ignores...
    expect(composite(balanced)).toBeGreaterThan(composite(buildOnly) * (1 - TOLERANCE));
    // ...while build-only still leads on the stat it optimizes exclusively.
    expect(buildOnly.totalBuildRate).toBeGreaterThan(balanced.totalBuildRate * (1 - TOLERANCE));
  });

  it('falls back to build rate when every weight is zero', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const optimized = optimizeArrayWithSwaps(board, {
      stat: WEIGHTED_STAT,
      weights: { totalBuildRate: 0, totalPlayerExpRate: 0, totalFlaggyRate: 0 },
      maxIterations: 80000,
      characters
    });
    expect(optimized.totalBuildRate).toBeGreaterThanOrEqual(baseline.totalBuildRate);
  });

  it('moves omni cogs, which are boosted by their own neighbours', () => {
    const board = makeBoard();
    board[0] = makeSlot(0, {
      a: { name: '_Build_Rate/HR', value: 5000 },
      e: { name: '%_Build_Rate', value: 20 },
      h: 'everything'
    }, 'CogZ');
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 120000, characters });
    const omniSlot = optimized.board.findIndex(({ cog }) => cog?.name === 'CogZ');
    expect(omniSlot).toBeGreaterThanOrEqual(0);
    // Its own build rate must be boosted by whatever now surrounds it.
    expect(optimized.board[omniSlot].cog.stats.a.value).toBeGreaterThan(5000);
  });
});

describe('move list', () => {
  // Walk the swaps the way a player would and check you land on exactly the optimized board.
  const applyMoves = (board, spares, moves) => {
    const positions = [...board.map(({ cog }) => cog), ...spares];
    moves.forEach(({ from, to }) => {
      const carried = positions[from];
      positions[from] = positions[to];
      positions[to] = carried;
    });
    return positions;
  };

  it('replays partway to a board that matches the same prefix of swaps', () => {
    const board = makeBoard();
    const spares = [
      { name: 'SpareA', stats: { a: { name: '_Build_Rate/HR', value: 90000 } }, originalIndex: 150 }
    ];
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalBuildRate',
      maxIterations: 120000,
      characters,
      spareCogs: structuredClone(spares)
    });
    expect(optimized.moves.length).toBeGreaterThan(3);

    [0, 1, 3, optimized.moves.length].forEach((count) => {
      const replayed = applyMoves(board, spares, optimized.moves.slice(0, count));
      const stepped = getBoardAtStep(board, spares, optimized.moves, count, characters);
      stepped.board.forEach((slot, index) => {
        expect(slot.cog.originalIndex).toBe(replayed[index].originalIndex);
      });
    });
  });

  it('lands on the optimized board at the last step and leaves it untouched at step 0', () => {
    const board = makeBoard();
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 120000, characters });

    const start = getBoardAtStep(board, [], optimized.moves, 0, characters);
    start.board.forEach((slot, index) => expect(slot.cog.originalIndex).toBe(index));

    // Clamps past the end rather than running off the array.
    const end = getBoardAtStep(board, [], optimized.moves, optimized.moves.length + 50, characters);
    end.board.forEach((slot, index) => {
      expect(slot.cog.originalIndex).toBe(optimized.board[index].cog.originalIndex);
    });
    expect(end.totalBuildRate).toBeCloseTo(optimized.totalBuildRate, 6);
  });

  it('reproduces the optimized board when applied in order', () => {
    const board = makeBoard();
    const spares = [
      { name: 'SpareA', stats: { a: { name: '_Build_Rate/HR', value: 90000 } }, originalIndex: 150 },
      { name: 'SpareB', stats: { a: { name: '_Build_Rate/HR', value: 80000 } }, originalIndex: 151 }
    ];
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalBuildRate',
      maxIterations: 120000,
      characters,
      spareCogs: structuredClone(spares)
    });

    expect(optimized.moves.length).toBeGreaterThan(0);
    const replayed = applyMoves(board, spares, optimized.moves);
    optimized.board.forEach((slot, index) => {
      expect(replayed[index].originalIndex).toBe(slot.cog.originalIndex);
    });
  });

  it('uses the fewest swaps possible and never touches a pinned slot', () => {
    const board = makeBoard();
    board[3] = { ...board[3], currentAmount: 0, requiredAmount: 100 };
    board[7] = { ...board[7], flagPlaced: true };
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 120000, characters });

    // One swap per displaced cog, minus one per cycle - so strictly fewer than the number of cogs
    // that ended up somewhere new.
    const displaced = optimized.board.filter(({ cog }, index) => cog.originalIndex !== index).length;
    expect(optimized.moves.length).toBeLessThan(displaced);
    optimized.moves.forEach(({ from, to }) => {
      expect([from, to]).not.toContain(3);
      expect([from, to]).not.toContain(7);
    });
  });

  it('marks a move out of the inventory with a null source slot', () => {
    const board = makeBoard();
    const spare = { name: 'Monster', stats: { a: { name: '_Build_Rate/HR', value: 1e7 } }, originalIndex: 150 };
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalBuildRate',
      maxIterations: 120000,
      characters,
      spareCogs: [spare]
    });

    const pull = optimized.moves.find(({ name }) => name === 'Monster');
    expect(pull).toBeDefined();
    expect(pull.fromSlot).toBeNull();
    expect(pull.from).toBeGreaterThanOrEqual(BOARD_SIZE);
    expect(pull.to).toBeLessThan(BOARD_SIZE);
  });

  it('returns an empty list when there is no time to search', () => {
    const optimized = optimizeArrayWithSwaps(makeBoard(), { stat: 'totalBuildRate', time: 0, characters });
    expect(optimized.moves).toEqual([]);
  });

  it('reports progress while it runs', () => {
    const seen = [];
    optimizeArrayWithSwaps(makeBoard(), {
      stat: 'totalBuildRate',
      time: 600,
      characters,
      onProgress: (progress) => seen.push(progress)
    });

    expect(seen.length).toBeGreaterThan(1);
    expect(seen.at(-1).elapsed).toBeLessThanOrEqual(seen.at(-1).budget);
    // Elapsed only moves forward, and the reported gain never goes backwards - it tracks the best
    // board found so far, not the current one.
    seen.forEach((progress, index) => {
      if (index === 0) return;
      expect(progress.elapsed).toBeGreaterThanOrEqual(seen[index - 1].elapsed);
      expect(progress.gain).toBeGreaterThanOrEqual(seen[index - 1].gain);
    });
  });
});

// The game only pays the Excogia boost while the four pieces sit in a 2x2, in piece order:
// CogZA00 top left, CogZA01 right of it, CogZA02 below it, CogZA03 below CogZA01.
const excogiaStats = () => ({
  a: { name: '_Build_Rate/HR', value: 175427 },
  c: { name: '_Flaggy_Rate/HR', value: 15677 },
  d: { name: '%_Bonus_Construct_EXP', value: 172 },
  e: { name: '%_Build_Rate', value: 1.25 },
  f: { name: '%_Player_Construct_XP', value: 20 },
  h: 'everything',
  l: 1
});

const placeExcogia = (board, anchor) => [0, 1, BOARD_X, BOARD_X + 1].forEach((offset, piece) => {
  board[anchor + offset] = makeSlot(anchor + offset, excogiaStats(), `CogZA0${piece}`);
});

const excogiaAnchors = (board) => board.reduce((anchors, slot, index) => {
  if (slot?.cog?.name !== 'CogZA00') return anchors;
  return [...anchors, index];
}, []);

const isAssembled = (board, anchor) => anchor % BOARD_X < BOARD_X - 1
  && Math.floor(anchor / BOARD_X) < BOARD_Y - 1
  && [0, 1, BOARD_X, BOARD_X + 1].every((offset, piece) => board[anchor + offset]?.cog?.name === `CogZA0${piece}`);

describe('excogia squares', () => {
  it('keeps an assembled square intact', () => {
    const board = makeBoard();
    placeExcogia(board, 30);
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 120000, characters });

    const anchors = excogiaAnchors(optimized.board);
    expect(anchors).toHaveLength(1);
    expect(isAssembled(optimized.board, anchors[0])).toBe(true);
  });

  it('keeps two squares intact and never overlaps them', () => {
    const board = makeBoard();
    placeExcogia(board, 26);
    placeExcogia(board, 28);
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 160000, characters });

    const anchors = excogiaAnchors(optimized.board);
    expect(anchors).toHaveLength(2);
    anchors.forEach((anchor) => expect(isAssembled(optimized.board, anchor)).toBe(true));
    const occupied = anchors.flatMap((anchor) => [0, 1, BOARD_X, BOARD_X + 1].map((offset) => anchor + offset));
    expect(new Set(occupied).size).toBe(8);
  });

  it('relocates a square that starts in a bad spot', () => {
    const board = makeBoard();
    // Park the square in the bottom-left corner and ring the top-left with strong build boosters,
    // so the best move is to pick the whole square up and carry it over there.
    placeExcogia(board, 82);
    [0, 1, 2, 3, 12, 15, 24, 25, 26, 27].forEach((index) => {
      board[index] = makeSlot(index, { e: { name: '%_Build_Rate', value: 400 }, h: 'around' });
    });
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 240000, characters });

    const anchors = excogiaAnchors(optimized.board);
    expect(anchors).toHaveLength(1);
    expect(isAssembled(optimized.board, anchors[0])).toBe(true);
    expect(anchors[0]).not.toBe(82);
    expect(optimized.totalBuildRate).toBeGreaterThan(baseline.totalBuildRate);
  });

  it('will not move a square onto a locked or flag-building slot', () => {
    const board = makeBoard();
    placeExcogia(board, 30);
    // Leave exactly one other legal 2x2 open by blocking every slot outside two columns.
    for (let index = 0; index < BOARD_SIZE; index++) {
      const column = index % BOARD_X;
      const inSquare = index >= 30 && [0, 1, BOARD_X, BOARD_X + 1].includes(index - 30);
      if (inSquare || column === 6 || column === 7) continue;
      board[index] = { ...board[index], flagPlaced: true };
    }
    const optimized = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', maxIterations: 120000, characters });

    const anchors = excogiaAnchors(optimized.board);
    expect(anchors).toHaveLength(1);
    expect(isAssembled(optimized.board, anchors[0])).toBe(true);
    expect([anchors[0] % BOARD_X, anchors[0] % BOARD_X + 1]).toContain(6);
  });

  it('strips the boost off a loose piece instead of scoring it as an omni cog', () => {
    const board = makeBoard();
    board[40] = makeSlot(40, excogiaStats(), 'CogZA00');
    const loose = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });

    const slot = loose.board.find(({ cog }) => cog?.name === 'CogZA00');
    expect(slot.cog.stats.h).toBeUndefined();
    expect(slot.cog.stats.e).toBeUndefined();
    expect(slot.cog.stats.f).toBeUndefined();
    // Base build rate is untouched - only the boost half of the cog is lost. The reported value is
    // the decorated one, so it sits at or above the base depending on what boosts that slot.
    expect(slot.cog.stats.a.value).toBeGreaterThanOrEqual(175427);
    // Nothing on the board is boosted by the loose piece any more.
    expect(loose.board.every(({ affectedBy }) => !affectedBy?.includes(40))).toBe(true);
  });

  it('does not let a loose inventory piece be pulled in as an omni cog', () => {
    const board = makeBoard();
    const spare = { name: 'CogZA00', stats: excogiaStats(), originalIndex: 150 };
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalBuildRate',
      maxIterations: 120000,
      characters,
      spareCogs: [spare]
    });

    const slot = optimized.board.find(({ cog }) => cog?.originalIndex === 150);
    if (slot) expect(slot.cog.stats.h).toBeUndefined();
    // Whatever it does with the piece, no square can form from one piece.
    expect(excogiaAnchors(optimized.board).filter((anchor) => isAssembled(optimized.board, anchor))).toHaveLength(0);
  });
});

// Spare characters sitting in the rack, each better at construction XP than anyone already placed,
// so a run optimizing for player XP has every reason to bring them all out.
const spareCharacters = (count) => Array.from({ length: count }, (_, i) => ({
  name: `Player_Spare${i}`,
  stats: {
    b: { name: '_Construct_Exp/HR', value: 50000 + i * 1000 },
    a: { name: '_Build_Rate/HR', value: 200 }
  },
  originalIndex: 200 + i
}));

// Plain cogs in the inventory. A character can only leave the board by swapping with something, so
// without these there is nothing to put in the slot it vacates.
const spareCogs = (count) => Array.from({ length: count }, (_, i) => ({
  name: `CogSpare${i}`,
  stats: { a: { name: '_Build_Rate/HR', value: 20 + i } },
  originalIndex: 300 + i
}));

describe('character cap', () => {
  const mixedSpares = () => [...spareCharacters(8), ...spareCogs(12)];

  const runWithCap = (maxCharacters, spares = mixedSpares()) => optimizeArrayWithSwaps(makeBoard(), {
    stat: 'totalPlayerExpRate',
    maxIterations: 120000,
    characters,
    spareCogs: spares,
    ...(maxCharacters === undefined ? {} : { maxCharacters })
  });

  // The behaviour users hit: left alone the search staffs the board with everybody it can find.
  it('sends every spare character out when uncapped', () => {
    const uncapped = runWithCap(undefined);
    expect(countBoardCharacters(uncapped.board)).toBeGreaterThan(countBoardCharacters(makeBoard()));
  });

  it.each([0, 1, 3])('never exceeds a cap of %i', (cap) => {
    expect(countBoardCharacters(runWithCap(cap).board)).toBeLessThanOrEqual(cap);
  });

  // The case this missed at first: a player whose inventory is empty apart from their characters.
  // A cog can only come off the board by trading places with something, so without the empty slots
  // in the pool there was nothing to trade with and the surplus characters stayed put.
  it('empties slots to enforce the cap when the inventory holds no spare cogs', () => {
    const blanks = Array.from({ length: 20 }, (_, i) => ({
      name: 'Blank',
      stats: {},
      originalIndex: 108 + i
    }));
    const optimized = runWithCap(1, [...spareCharacters(4), ...blanks]);
    expect(countBoardCharacters(optimized.board)).toBeLessThanOrEqual(1);
  });

  it.each(SEEDS)('never asks you to move one empty slot into another (seed %i)', (seed) => {
    useSeed(seed);
    const blanks = Array.from({ length: 40 }, (_, i) => ({
      name: 'Blank',
      stats: {},
      originalIndex: 108 + i
    }));
    // Some board slots start empty, which is where the pointless shuffling used to show up.
    const board = makeBoard();
    [5, 17, 40].forEach((index) => {
      board[index] = { ...board[index], cog: { name: 'Blank', stats: {}, originalIndex: index } };
    });
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalPlayerExpRate',
      maxIterations: 120000,
      characters,
      spareCogs: [...spareCharacters(4), ...blanks],
      maxCharacters: 2
    });

    const noOps = optimized.moves.filter(({ name, displacedName }) => name === 'Blank' && displacedName === 'Blank');
    expect(noOps).toHaveLength(0);
    // A slot that started empty and is still empty keeps its own blank rather than being handed one
    // from the inventory. Slots emptied by the cap legitimately take an inventory blank instead.
    [5, 17, 40].forEach((index) => {
      const { cog } = optimized.board[index];
      if (cog?.name === 'Blank') expect(cog.originalIndex).toBe(index);
    });
    const replayed = getBoardAtStep(board, [...spareCharacters(4), ...blanks], optimized.moves, optimized.moves.length, characters);
    replayed.board.forEach((slot, index) => {
      expect(slot.cog.originalIndex).toBe(optimized.board[index].cog.originalIndex);
    });
  });

  it('leaves nobody on the board at a cap of zero', () => {
    const optimized = runWithCap(0);
    expect(countBoardCharacters(optimized.board)).toBe(0);
    expect(optimized.board.some(({ cog }) => cog?.name?.includes('Player_'))).toBe(false);
  });

  it('still improves the stat while capped', () => {
    const baseline = optimizeArrayWithSwaps(makeBoard(), { stat: 'totalPlayerExpRate', time: 0, characters });
    const capped = runWithCap(3);
    expect(capped.totalPlayerExpRate).toBeGreaterThan(baseline.totalPlayerExpRate);
  });

  // The starting board is already over these caps, and optimizing for player XP gives the search
  // every reason to keep the characters where they are - so the surplus has to be evicted up front
  // rather than left for the search to discover.
  it('brings an over-staffed starting board down to the cap', () => {
    const plainSpares = [{
      name: 'CogSpare',
      stats: { a: { name: '_Build_Rate/HR', value: 10 } },
      originalIndex: 300
    }];
    const starting = countBoardCharacters(makeBoard());
    expect(starting).toBeGreaterThan(1);
    // One spare to swap into, so exactly one character can come off.
    expect(countBoardCharacters(runWithCap(1, plainSpares).board)).toBe(starting - 1);
  });

  // Two runs of a randomised search will not agree cog for cog, so this only asserts the cap has
  // stopped constraining: the board is free to go past where it started.
  it('lets the board grow past its starting headcount when the cap allows', () => {
    const spares = mixedSpares();
    const total = countBoardCharacters(makeBoard()) + spares.filter(({ name }) => name.includes('Player_')).length;
    const capped = countBoardCharacters(runWithCap(total, spares).board);
    expect(capped).toBeGreaterThan(countBoardCharacters(makeBoard()));
    expect(capped).toBeLessThanOrEqual(total);
  });
});

// A budgeted run answers "the best board I can reach in at most N swaps", so the plan it hands back
// has to be short enough to actually follow. Every assertion here is about that ceiling holding.
describe('swap budget', () => {
  const replay = (board, spares, moves) => {
    const positions = [...board.map(({ cog }) => cog), ...spares];
    moves.forEach(({ from, to }) => {
      const carried = positions[from];
      positions[from] = positions[to];
      positions[to] = carried;
    });
    return positions;
  };

  const budgeted = (board, maxSwaps, extra = {}) => optimizeArrayWithSwaps(board, {
    stat: 'totalBuildRate',
    maxIterations: 60000,
    characters,
    maxSwaps,
    ...extra
  });

  it.each([0, 1, 3, 8])('returns at most %i moves', (maxSwaps) => {
    expect(budgeted(makeBoard(), maxSwaps).moves.length).toBeLessThanOrEqual(maxSwaps);
  });

  it('reproduces the board it returns when the budgeted moves are replayed', () => {
    const board = makeBoard();
    const optimized = budgeted(board, 5);
    const replayed = replay(board, [], optimized.moves);
    optimized.board.forEach((slot, index) => {
      expect(replayed[index].originalIndex).toBe(slot.cog.originalIndex);
    });
  });

  it('improves the board even when only one swap is allowed', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    const optimized = budgeted(board, 1);

    expect(optimized.moves).toHaveLength(1);
    expect(optimized.totalBuildRate).toBeGreaterThan(baseline.totalBuildRate);
  });

  it('gets more out of a bigger budget', () => {
    const board = makeBoard();
    expect(budgeted(board, 8).totalBuildRate).toBeGreaterThan(budgeted(board, 2).totalBuildRate);
  });

  it('never returns a board worse than the starting one', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    expect(budgeted(board, 4).totalBuildRate).toBeGreaterThanOrEqual(baseline.totalBuildRate);
  });

  it('leaves pinned slots alone', () => {
    const board = makeBoard();
    board[3] = { ...board[3], currentAmount: 0, requiredAmount: 100 };
    board[7] = { ...board[7], flagPlaced: true };
    budgeted(board, 6).moves.forEach(({ from, to }) => {
      expect([from, to]).not.toContain(3);
      expect([from, to]).not.toContain(7);
    });
  });

  // A square is four cogs, so relocating one costs four of the budget. Rather than spend a small
  // budget that way the search leaves squares where they are, which must not break them apart.
  it('keeps an assembled Excogia square together', () => {
    const board = makeBoard();
    placeExcogia(board, 30);
    const optimized = budgeted(board, 6);
    expect(excogiaAnchors(optimized.board).some((anchor) => isAssembled(optimized.board, anchor))).toBe(true);
  });

  // Under a budget the character cap is a ceiling, not a chore to work through first. Benching nine
  // characters can eat a small budget whole and hand back a board far worse than the one you have,
  // so a budgeted run refuses to add characters past the cap and otherwise leaves the count alone.
  it('never adds characters past the cap', () => {
    const board = makeBoard().map((slot, index) => (index % 11 === 0
      ? makeSlot(index, { a: { name: '_Build_Rate/HR', value: 40 } })
      : slot));
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalPlayerExpRate',
      maxIterations: 60000,
      characters,
      spareCogs: [...spareCharacters(8), ...spareCogs(12)],
      maxCharacters: 2,
      maxSwaps: 6
    });

    expect(optimized.moves.length).toBeLessThanOrEqual(6);
    expect(countBoardCharacters(optimized.board)).toBeLessThanOrEqual(2);
  });

  it('spends the budget on gains rather than on benching characters', () => {
    const board = makeBoard();
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });
    // A cap far below the nine characters already out there, and nowhere near enough budget to meet
    // it. Enforcing it first would burn every swap and hand back a much worse board.
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalBuildRate',
      maxIterations: 60000,
      characters,
      spareCogs: spareCogs(12),
      maxCharacters: 0,
      maxSwaps: 4
    });

    expect(optimized.moves.length).toBeLessThanOrEqual(4);
    expect(optimized.totalBuildRate).toBeGreaterThan(baseline.totalBuildRate);
  });

  // Bringing a board down to the character cap costs swaps of its own. Those come out of the same
  // budget, so the ceiling still holds even when the cap alone cannot be met.
  it('keeps the ceiling when the character cap needs more swaps than the budget', () => {
    const board = makeBoard();
    const optimized = optimizeArrayWithSwaps(board, {
      stat: 'totalBuildRate',
      maxIterations: 60000,
      characters,
      spareCogs: spareCogs(12),
      maxCharacters: 0,
      maxSwaps: 2
    });

    expect(optimized.moves.length).toBeLessThanOrEqual(2);
  });

  it('ignores a negative budget rather than refusing to move', () => {
    expect(budgeted(makeBoard(), -1).moves.length).toBeGreaterThan(0);
  });
});

// The point of the curve is that nobody knows up front whether the worthwhile swaps run out at 3 or
// at 15, so the tool runs a few budgets and shows what each one buys.
describe('optimizeSwapCurve', () => {
  const curve = (board, extra = {}) => optimizeSwapCurve(board, {
    stat: 'totalBuildRate',
    characters,
    swapBudgets: [1, 3, 8],
    maxIterations: 20000,
    ...extra
  });

  it('returns one entry per requested budget, in order', () => {
    const { entries } = curve(makeBoard());
    expect(entries.map(({ maxSwaps }) => maxSwaps)).toEqual([1, 3, 8]);
  });

  it('keeps every entry inside its own budget', () => {
    curve(makeBoard()).entries.forEach(({ maxSwaps, moves }) => {
      expect(moves.length).toBeLessThanOrEqual(maxSwaps);
    });
  });

  it('reports each entry gain against the current board', () => {
    const board = makeBoard();
    const { current, entries } = curve(board);
    const baseline = optimizeArrayWithSwaps(board, { stat: 'totalBuildRate', time: 0, characters });

    expect(current.totalBuildRate).toBeCloseTo(baseline.totalBuildRate, 6);
    entries.forEach(({ gain, totalBuildRate }) => {
      expect(gain).toBeCloseTo(totalBuildRate / current.totalBuildRate - 1, 9);
      expect(gain).toBeGreaterThanOrEqual(0);
    });
  });

  it('includes the unbudgeted run so the budgets can be read as a fraction of it', () => {
    const { unlimited } = curve(makeBoard());
    expect(unlimited.maxSwaps).toBeNull();
    expect(unlimited.moves.length).toBeGreaterThan(8);
    expect(unlimited.gain).toBeGreaterThan(0);
  });

  it('carries a board on every entry so a chosen budget can be previewed', () => {
    curve(makeBoard()).entries.forEach(({ board }) => {
      expect(board).toHaveLength(BOARD_SIZE);
    });
  });

  it('splits one time budget across the runs instead of spending it on each', () => {
    const started = Date.now();
    curve(makeBoard(), { time: 900, maxIterations: undefined });
    // Four runs sharing 900ms, plus the greedy seeds. Generous, but far under 4 x 900.
    expect(Date.now() - started).toBeLessThan(2600);
  });

  it('reports progress that runs to completion across the whole set', () => {
    const seen = [];
    curve(makeBoard(), { onProgress: (progress) => seen.push(progress) });
    expect(seen.length).toBeGreaterThan(1);
    seen.forEach((progress, index) => {
      if (index === 0) return;
      expect(progress.elapsed).toBeGreaterThanOrEqual(seen[index - 1].elapsed);
    });
    expect(seen.at(-1).elapsed / seen.at(-1).budget).toBeGreaterThan(0.9);
  });
});

// Which budget to preselect. Left on the unbudgeted plan the curve is just extra reading, so the
// default lands on the cheapest budget that already gets you effectively all of the gain.
describe('bestValuePlan', () => {
  const curveOf = (pairs, unlimitedGain) => ({
    entries: pairs.map(([maxSwaps, gain]) => ({ maxSwaps, gain, moves: new Array(maxSwaps).fill({}) })),
    unlimited: { maxSwaps: null, gain: unlimitedGain, moves: new Array(80).fill({}) }
  });

  it('picks the cheapest budget that reaches almost all of the gain', () => {
    const curve = curveOf([[1, 0.02], [3, 0.05], [5, 0.0688], [10, 0.0695]], 0.07);
    expect(bestValuePlan(curve).maxSwaps).toBe(5);
  });

  it('falls back to the unbudgeted plan when no budget comes close', () => {
    const curve = curveOf([[1, 0.01], [3, 0.02], [5, 0.03]], 0.20);
    expect(bestValuePlan(curve).maxSwaps).toBeNull();
  });

  it('takes the smallest budget when they all tie', () => {
    const curve = curveOf([[1, 0.05], [3, 0.05], [5, 0.05]], 0.05);
    expect(bestValuePlan(curve).maxSwaps).toBe(1);
  });

  it('returns the unbudgeted plan when nothing improves the board', () => {
    const curve = curveOf([[1, 0], [3, 0]], 0);
    expect(bestValuePlan(curve).maxSwaps).toBeNull();
  });

  it('skips a budget that produced no moves at all', () => {
    const curve = { entries: [{ maxSwaps: 1, gain: 0.07, moves: [] }, { maxSwaps: 3, gain: 0.07, moves: [{}, {}] }], unlimited: { maxSwaps: null, gain: 0.07, moves: [{}] } };
    expect(bestValuePlan(curve).maxSwaps).toBe(3);
  });
});

// A bigger budget reading as worse than a cheaper one would be nonsense on screen. Nothing enforces
// that directly - it falls out of the greedy seed, whose first k picks are the same whatever the cap,
// and of the annealer only ever replacing that seed with something better. These guard the property
// so a future change to either half cannot quietly lose it.
describe('swap curve monotonicity', () => {
  it('never reports a bigger budget as worse than a cheaper one', () => {
    const { entries, unlimited } = optimizeSwapCurve(makeBoard(), {
      stat: 'totalBuildRate',
      characters,
      swapBudgets: [1, 3, 5, 10],
      // Deliberately mean: not enough for the wide searches to converge on their own.
      maxIterations: 2000
    });

    entries.forEach(({ gain }, index) => {
      if (index === 0) return;
      expect(gain).toBeGreaterThanOrEqual(entries[index - 1].gain);
    });
    expect(unlimited.gain).toBeGreaterThanOrEqual(entries.at(-1).gain);
  });

  it('keeps a carried-forward plan inside the budget it is reported under', () => {
    const { entries } = optimizeSwapCurve(makeBoard(), {
      stat: 'totalBuildRate',
      characters,
      swapBudgets: [1, 3, 5, 10],
      maxIterations: 2000
    });

    entries.forEach(({ maxSwaps, moves }) => {
      expect(moves.length).toBeLessThanOrEqual(maxSwaps);
    });
  });

  it('reports the gain of the plan it actually returns', () => {
    const { current, entries, unlimited } = optimizeSwapCurve(makeBoard(), {
      stat: 'totalBuildRate',
      characters,
      swapBudgets: [1, 5],
      maxIterations: 2000
    });

    [...entries, unlimited].forEach(({ gain, totalBuildRate }) => {
      expect(gain).toBeCloseTo(totalBuildRate / current.totalBuildRate - 1, 9);
    });
  });
});

// The unbudgeted search has no greedy seed, so on a tight clock a budgeted run can beat it outright.
// Reporting that verbatim puts "all 89 moves, +72.5%" underneath "20 swaps, +73%", which reads as a
// bug even though both numbers are real. An unlimited budget can afford any budgeted plan, so the
// unbudgeted slot takes the best plan found rather than only its own.
describe('unbudgeted plan is never beaten by a budgeted one', () => {
  const starved = (extra = {}) => optimizeSwapCurve(makeBoard(), {
    stat: 'totalBuildRate',
    characters,
    swapBudgets: [4, 12],
    // Greedy runs to its budget regardless, so a near-zero iteration allowance starves the
    // unconstrained annealer while the budgeted runs still find real gains.
    maxIterations: 1,
    ...extra
  });

  it('reports at least the best budgeted gain', () => {
    const { entries, unlimited } = starved();
    entries.forEach(({ gain }) => expect(unlimited.gain).toBeGreaterThanOrEqual(gain));
  });

  it('hands back the plan those numbers describe', () => {
    const { current, unlimited } = starved();
    expect(unlimited.gain).toBeCloseTo(unlimited.totalBuildRate / current.totalBuildRate - 1, 9);
    expect(unlimited.board.length).toBe(BOARD_SIZE);
  });

  it('stays labelled as the unbudgeted plan', () => {
    expect(starved().unlimited.maxSwaps).toBeNull();
  });
});

// A budgeted plan is scored as a whole list, so a swap that drags an empty inventory slot onto the
// board can ride along with genuinely good swaps and still come out ahead on the total. That leaves
// real cogs in the bag and holes in the board, which is never what anyone asked for. No character
// cap here, so eviction never runs and any hole is the search's own doing.
// The case that actually bites needs a real board - see construction-optimizer-blanks.test.js.
describe('swap budget never empties a board slot', () => {
  const blankSpares = (count) => Array.from({ length: count }, (_, i) => ({
    name: 'Blank',
    stats: {},
    originalIndex: 400 + i
  }));

  const wideRun = () => optimizeArrayWithSwaps(makeBoard(), {
    stat: 'totalBuildRate',
    characters,
    spareCogs: [...blankSpares(30), ...spareCogs(6)],
    maxSwaps: 40,
    maxIterations: 40000
  });

  it('leaves every slot filled', () => {
    expect(wideRun().board.filter(({ cog }) => cog?.name && cog.name !== 'Blank')).toHaveLength(BOARD_SIZE);
  });

  it('never lists a move that brings a blank in from the inventory', () => {
    expect(wideRun().moves.filter(({ fromSlot, name }) => fromSlot === null && name === 'Blank')).toEqual([]);
  });
});

// The unbudgeted slot adopts the best plan found, so when a budget wins outright the two describe
// the same board and the picker would show the row twice. Flag it so the caller can drop one.
describe('redundant unbudgeted plan', () => {
  it('marks the unbudgeted plan redundant when a budget already found it', () => {
    const { entries, unlimited } = optimizeSwapCurve(makeBoard(), {
      stat: 'totalBuildRate',
      characters,
      swapBudgets: [4, 12],
      // Starves the unconstrained annealer while the budgeted runs, which are greedy seeded, do not.
      maxIterations: 1
    });

    expect(unlimited.gain).toBe(Math.max(...entries.map(({ gain }) => gain)));
    expect(unlimited.redundant).toBe(true);
  });

  it('leaves the unbudgeted plan standing when it wins on its own', () => {
    const { entries, unlimited } = optimizeSwapCurve(makeBoard(), {
      stat: 'totalBuildRate',
      characters,
      swapBudgets: [1, 2],
      maxIterations: 120000
    });

    expect(unlimited.gain).toBeGreaterThan(Math.max(...entries.map(({ gain }) => gain)));
    expect(unlimited.redundant).toBe(false);
  });
});

// What the picker actually renders: every budget, plus the unbudgeted plan only when it is its own
// board rather than a second name for one of them.
describe('curvePlans', () => {
  const curveOf = (redundant) => ({
    entries: [
      { maxSwaps: 1, gain: 0.02, moves: [{}] },
      { maxSwaps: 5, gain: 0.09, moves: [{}, {}] }
    ],
    unlimited: { maxSwaps: null, gain: redundant ? 0.09 : 0.2, moves: [{}, {}, {}], redundant }
  });

  it('drops the unbudgeted plan when a budget already found it', () => {
    expect(curvePlans(curveOf(true)).map(({ maxSwaps }) => maxSwaps)).toEqual([1, 5]);
  });

  it('keeps the unbudgeted plan when it stands on its own', () => {
    expect(curvePlans(curveOf(false)).map(({ maxSwaps }) => maxSwaps)).toEqual([1, 5, null]);
  });

  it('returns nothing without a curve', () => {
    expect(curvePlans(null)).toEqual([]);
  });

  // Whatever the picker preselects has to be a row it is actually showing, or nothing looks selected.
  it('always contains the plan bestValuePlan picks', () => {
    [true, false].forEach((redundant) => {
      const curve = curveOf(redundant);
      expect(curvePlans(curve)).toContain(bestValuePlan(curve));
    });
  });

  it('picks a shown plan even when nothing improves the board', () => {
    const flat = {
      entries: [{ maxSwaps: 3, gain: 0, moves: [{}] }],
      unlimited: { maxSwaps: null, gain: 0, moves: [{}], redundant: true }
    };
    expect(curvePlans(flat)).toContain(bestValuePlan(flat));
  });
});
