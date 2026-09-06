// Pure board maths for the construction optimizer. Deliberately free of `@website-data` and of the
// other parsers, so it can be bundled into a Web Worker without dragging a 9MB JSON along.

export const BOARD_Y = 8;
export const BOARD_X = 12;
export const BOARD_SIZE = BOARD_X * BOARD_Y;

// Off the board, CogOrder 96-107 is the character rack and 108+ the cog inventory. The game draws
// both 3 wide (N.js:93423 and :93438) and pages the inventory 15 at a time, so an index maps to an
// exact spot the player can go to rather than a number they have to hunt for.
const INVENTORY_START = 108;
const RACK_COLUMNS = 3;
const INVENTORY_PAGE_SIZE = 15;

/** Where a cog sits, worded the way the game lays it out. */
export const cogSlotLabel = (index: number | null | undefined) => {
  if (index === null || index === undefined || index < 0) return 'Inventory';
  if (index < BOARD_SIZE) return `R${Math.floor(index / BOARD_X) + 1}C${index % BOARD_X + 1}`;
  if (index < INVENTORY_START) {
    const offset = index - BOARD_SIZE;
    return `Chars R${Math.floor(offset / RACK_COLUMNS) + 1}C${offset % RACK_COLUMNS + 1}`;
  }
  const offset = index - INVENTORY_START;
  const withinPage = offset % INVENTORY_PAGE_SIZE;
  return `Inv P${Math.floor(offset / INVENTORY_PAGE_SIZE) + 1}`
    + ` R${Math.floor(withinPage / RACK_COLUMNS) + 1}C${withinPage % RACK_COLUMNS + 1}`;
}

// Excogia is a gem shop cog that arrives as four pieces and only pays out while they sit in a 2x2
// square: CogZA00 top left, CogZA01 to its right, CogZA02 directly below it, CogZA03 below CogZA01.
// The game strips h/e/f off every loose piece, then hands them back to the four pieces of a square.
/** Character cogs are named after the character standing in the slot: Player_<name>. */
export const isCharacterCog = (cog: any) => typeof cog?.name === 'string' && cog.name.includes('Player_');

/** How many characters are currently out on the board rather than back home making cogs. */
export const countBoardCharacters = (board: any[]) => (board || [])
  .slice(0, BOARD_SIZE)
  .reduce((total: number, slot: any) => total + (isCharacterCog(slot?.cog) ? 1 : 0), 0);

const EXCOGIA_PREFIX = 'CogZA0';
const EXCOGIA_OFFSETS = [0, 1, BOARD_X, BOARD_X + 1];

export const excogiaPieceIndex = (name: any) => {
  if (typeof name !== 'string' || !name.startsWith(EXCOGIA_PREFIX)) return -1;
  const piece = Number(name.slice(EXCOGIA_PREFIX.length));
  return piece >= 0 && piece <= 3 ? piece : -1;
}

// A square can't straddle the right edge or hang off the bottom row.
const isExcogiaAnchor = (anchor: number) => anchor % BOARD_X < BOARD_X - 1
  && Math.floor(anchor / BOARD_X) < BOARD_Y - 1;

// The squares the game currently counts as assembled.
const findExcogiaBlocks = (board: any[]) => {
  const blocks: number[][] = [];
  const claimed = new Set<number>();
  for (let anchor = 0; anchor < BOARD_SIZE; anchor++) {
    if (excogiaPieceIndex(board?.[anchor]?.cog?.name) !== 0 || !isExcogiaAnchor(anchor)) continue;
    const slots = EXCOGIA_OFFSETS.map((offset) => anchor + offset);
    if (slots.some((slot) => claimed.has(slot))) continue;
    if (!slots.every((slot, piece) => excogiaPieceIndex(board?.[slot]?.cog?.name) === piece)) continue;
    slots.forEach((slot) => claimed.add(slot));
    blocks.push(slots);
  }
  return blocks;
}

// Mirrors the game's first pass over loose pieces.
export const stripExcogiaBoost = (cog: any) => {
  const { h, e, f, ...stats } = cog?.stats || {};
  return { ...cog, stats };
}

// Board slots holding a piece of an assembled square. Everything else with an Excogia name is loose.
export const getAssembledExcogiaSlots = (board: any[]) => new Set<number>(findExcogiaBlocks(board).flat());

/**
 * The cog pool a placement indexes into: every board slot first, then the spare cogs. Pieces of an
 * assembled square keep their boost because a square is only ever moved whole; every other piece is
 * scored the way the game scores a loose one.
 */
const normalizeCogs = (baseBoard: any[], spares: any[]) => {
  const inAssembledBlock = getAssembledExcogiaSlots(baseBoard);
  const normalize = (cog: any, position: number) => excogiaPieceIndex(cog?.name) >= 0 && !inAssembledBlock.has(position)
    ? stripExcogiaBoost(cog)
    : cog;
  return [
    ...baseBoard.map((slot: any, index: number) => normalize(slot?.cog, index)),
    ...spares.map((cog: any, index: number) => normalize(cog, BOARD_SIZE + index))
  ];
}

interface CompiledCog {
  buildRate: number;
  flaggyRate: number;
  expRate: number;
  buildBoost: number;
  playerExpBoost: number;
  flaggyBoost: number;
  shape: string | null;
  boosts: boolean;
  playerBase: number;
}

const compileCog = (cog: any, characters?: any[]): CompiledCog => {
  const stats = cog?.stats || {};
  const buildBoost = stats?.e?.value || 0;
  const playerExpBoost = stats?.f?.value || 0;
  const flaggyBoost = stats?.g?.value || 0;
  const shape = typeof stats?.h === 'string' ? stats.h : null;
  let playerBase = 0;
  if (isCharacterCog(cog)) {
    const character = characters?.find(({ name }: any) => name === cog?.name?.replace('Player_', ''));
    // Fall back to the value stored in the save when the character can't be matched.
    playerBase = character?.constructionExpPerHour ?? stats?.b?.value ?? 0;
  }
  return {
    buildRate: stats?.a?.value || 0,
    flaggyRate: stats?.c?.value || 0,
    expRate: stats?.d?.value || 0,
    buildBoost,
    playerExpBoost,
    flaggyBoost,
    shape,
    boosts: shape !== null && (buildBoost !== 0 || playerExpBoost !== 0 || flaggyBoost !== 0),
    playerBase
  };
}

// Board slots a cog of the given shape reaches, precomputed per shape for every slot.
const shapeTargetsCache: Record<string, number[][]> = {};

const getShapeTargets = (shape: string, slot: number): number[] => {
  let perSlot = shapeTargetsCache[shape];
  if (!perSlot) {
    perSlot = shapeTargetsCache[shape] = [];
    for (let index = 0; index < BOARD_SIZE; index++) {
      const x = index % BOARD_X;
      const y = (BOARD_Y - 1) - Math.floor(index / BOARD_X);
      perSlot[index] = getAffectedIndexes({ stats: { h: shape } }, x, y)
        .map(([targetX, targetY]: any) => (targetX < 0 || targetY < 0 || targetX >= BOARD_X || targetY >= BOARD_Y)
          ? -1
          : (BOARD_Y - 1 - targetY) * BOARD_X + targetX)
        .filter((index: number) => index !== -1);
    }
  }
  return perSlot[slot];
}

// Reused across the whole optimizer run - scoring is hot enough that allocating here shows up.
const buildBoostScratch = new Float64Array(BOARD_SIZE);
const playerExpBoostScratch = new Float64Array(BOARD_SIZE);
const flaggyBoostScratch = new Float64Array(BOARD_SIZE);

// Totals only - no board is materialised. Must stay in sync with the decoration in evaluateBoard,
// which is why evaluateBoard takes its totals from here instead of recomputing them.
const scorePlacement = (placement: Int32Array, pool: CompiledCog[]) => {
  buildBoostScratch.fill(0);
  playerExpBoostScratch.fill(0);
  flaggyBoostScratch.fill(0);
  for (let slot = 0; slot < BOARD_SIZE; slot++) {
    const cog = pool[placement[slot]];
    if (!cog?.boosts) continue;
    const targets = getShapeTargets(cog.shape as string, slot);
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      buildBoostScratch[target] += cog.buildBoost;
      playerExpBoostScratch[target] += cog.playerExpBoost;
      flaggyBoostScratch[target] += cog.flaggyBoost;
    }
  }
  let totalBuildRate = 0, totalExpRate = 0, totalFlaggyRate = 0, playerExp = 0;
  for (let slot = 0; slot < BOARD_SIZE; slot++) {
    const cog = pool[placement[slot]];
    if (!cog) continue;
    totalBuildRate += Math.max(cog.buildRate * (1 + buildBoostScratch[slot] / 100), 0);
    totalExpRate += cog.expRate;
    totalFlaggyRate += Math.max(cog.flaggyRate * (1 + flaggyBoostScratch[slot] / 100), 0);
    if (cog.playerBase) {
      playerExp += cog.playerBase * (1 + playerExpBoostScratch[slot] / 100);
    }
  }
  return {
    totalBuildRate,
    totalExpRate,
    totalFlaggyRate,
    totalPlayerExpRate: playerExp * (1 + totalExpRate / 100)
  };
}

const START_TEMPERATURE = 0.02;   // relative score swing accepted early on
const END_TEMPERATURE = 0.00002;
const TIME_CHECK_MASK = 511;      // only read the clock every 512 iterations
const BLOCK_MOVE_CHANCE = 0.15;   // roughly the share of the board an Excogia square takes up
const PROGRESS_INTERVAL = 100;    // ms between progress callbacks

// Optimize every stat at once instead of picking a single one.
export const WEIGHTED_STAT = 'weighted';
export const WEIGHTED_STAT_KEYS = ['totalBuildRate', 'totalPlayerExpRate', 'totalFlaggyRate'] as const;

export type WeightedStatKey = typeof WEIGHTED_STAT_KEYS[number];
export type StatWeights = Partial<Record<WeightedStatKey, number>>;

/** Budgets a curve run tries when the caller does not name its own. Spaced to show where the gain flattens. */
export const DEFAULT_SWAP_BUDGETS = [1, 4, 10, 20];

export interface OptimizeProgress {
  elapsed: number;
  budget: number;
  iterations: number;
  /** Improvement of the objective over the starting board, as a ratio (0.12 = +12%). */
  gain: number;
}

export interface OptimizeOptions {
  stat?: string;
  weights?: StatWeights;
  time?: number;
  characters?: any[];
  spareCogs?: any[];
  multipliers?: { flaggy?: number; exp?: number };
  /**
   * Most characters allowed on the board at once. Characters score well, so left alone the search
   * puts every one of them out there and leaves nobody making cogs. Omit for no limit.
   */
  maxCharacters?: number;
  /**
   * Most in-game swaps allowed between the board you have now and the result. A budgeted run answers
   * "the best board I can reach in this many drags" rather than the best board outright, which is
   * usually most of the gain for a small fraction of the clicking. Omit for no limit.
   */
  maxSwaps?: number;
  maxIterations?: number;
  onProgress?: (progress: OptimizeProgress) => void;
}

export interface SwapCurveOptions extends OptimizeOptions {
  /** Budgets to search, smallest first. Defaults to DEFAULT_SWAP_BUDGETS. */
  swapBudgets?: number[];
}

/** One drag in game: pick the cog up at `from`, drop it on `to`, which sends `displaced` back. */
export interface OptimizeMove {
  from: number;
  to: number;
  /** null when the cog comes out of the cog inventory rather than off the board. */
  fromSlot: number | null;
  /**
   * CogOrder index of the slot the cog is picked up from, board or not. Unlike `fromSlot` this is
   * always set, so it can be labelled - pool positions past the board are physical inventory slots,
   * which is why the cog that *started* there names the location.
   */
  fromIndex: number;
  name: string;
  originalIndex: number;
  displacedName: string;
  displacedOriginalIndex: number;
}

export const isBlankCog = (cog: any) => !cog || cog.name === 'Blank';

// Turn "where every cog ended up" into the shortest list of swaps that gets you there from the
// board you have now. Applying them top to bottom reproduces the returned placement exactly - which
// is why the caller builds its board from that placement rather than from the one it passed in.
const buildMoves = (target: Int32Array, cogs: any[]): { moves: OptimizeMove[]; placement: Int32Array } => {
  const current = new Int32Array(target.length);
  const where = new Int32Array(target.length);
  for (let index = 0; index < target.length; index++) {
    current[index] = index;
    where[index] = index;
  }
  const desired = Int32Array.from(target);
  const wantedAt = new Int32Array(target.length);
  for (let index = 0; index < desired.length; index++) wantedAt[desired[index]] = index;

  const moves: OptimizeMove[] = [];
  // Only board positions need fixing; whatever shuffling that leaves in the inventory is invisible.
  for (let position = 0; position < BOARD_SIZE; position++) {
    const wanted = desired[position];
    if (current[position] === wanted) continue;
    const displaced = current[position];

    if (isBlankCog(cogs[wanted]) && isBlankCog(cogs[displaced])) {
      const swapWith = wantedAt[displaced];
      desired[position] = displaced;
      wantedAt[displaced] = position;
      desired[swapWith] = wanted;
      wantedAt[wanted] = swapWith;
      continue;
    }

    const source = where[wanted];
    moves.push({
      from: source,
      to: position,
      fromSlot: source < BOARD_SIZE ? source : null,
      fromIndex: source < BOARD_SIZE ? source : (cogs[source]?.originalIndex ?? source),
      name: cogs[wanted]?.name ?? 'Blank',
      originalIndex: cogs[wanted]?.originalIndex ?? wanted,
      displacedName: cogs[displaced]?.name ?? 'Blank',
      displacedOriginalIndex: cogs[displaced]?.originalIndex ?? displaced
    });
    current[position] = wanted;
    where[wanted] = position;
    current[source] = displaced;
    where[displaced] = source;
  }
  return { moves, placement: current };
}

// Build rate, player XP and flaggy rate differ by orders of magnitude and by account, so a raw
// weighted sum would just track whichever number happens to be biggest. Scoring each stat against
// the board's current value instead makes the weights pure priorities: the score sits at 1.0 for
// the starting board, and a weight of 2 vs 1 really does mean "twice as important".
const makeObjective = (stat: string, weights: StatWeights | undefined, baseline: any) => {
  if (stat !== WEIGHTED_STAT) {
    return (totals: any) => totals?.[stat] ?? 0;
  }
  const terms = WEIGHTED_STAT_KEYS
    .map((key) => ({ key, weight: weights?.[key] ?? 0, reference: Math.max(Math.abs(baseline?.[key] ?? 0), 1e-6) }))
    .filter(({ weight }) => weight > 0);
  if (terms.length === 0) {
    return (totals: any) => totals?.totalBuildRate ?? 0;
  }
  const totalWeight = terms.reduce((sum, { weight }) => sum + weight, 0);
  return (totals: any) => terms.reduce((score, { key, weight, reference }) =>
    score + (weight / totalWeight) * ((totals?.[key] ?? 0) / reference), 0);
}

// The board totals parseFlags publishes have the gem shop flaggy multi and the small cog XP multi
// folded in. Apply the same ones here so an optimized board can be diffed against the current one.
const applyBoardMultipliers = (result: any, multipliers?: { flaggy?: number; exp?: number }) => {
  if (!multipliers) return result;
  return {
    ...result,
    totalFlaggyRate: result.totalFlaggyRate * (multipliers.flaggy ?? 1),
    totalExpRate: result.totalExpRate * (multipliers.exp ?? 1)
  };
}

export const optimizeArrayWithSwaps = (arr: any[], options: OptimizeOptions = {}) => {
  const {
    stat = 'totalBuildRate',
    weights,
    time = 2500,
    characters,
    spareCogs,
    multipliers,
    maxCharacters,
    maxSwaps,
    maxIterations,
    onProgress
  } = options;
  const iterationBudget = Number.isFinite(maxIterations as number) && (maxIterations as number) > 0
    ? Math.trunc(maxIterations as number)
    : 0;
  const baseBoard = arr || [];
  const spares = spareCogs || [];
  const assembled = findExcogiaBlocks(baseBoard);
  const cogs = normalizeCogs(baseBoard, spares);
  const pool = cogs.map((cog: any) => compileCog(cog, characters));

  // Cap on how many characters may stand on the board at once. Anything below zero, or not a number
  // at all, means no cap - which is how every caller behaved before the option existed.
  const characterCap = Number.isFinite(maxCharacters as number) && (maxCharacters as number) >= 0
    ? Math.trunc(maxCharacters as number)
    : Infinity;
  const swapCap = Number.isFinite(maxSwaps as number) && (maxSwaps as number) >= 0
    ? Math.trunc(maxSwaps as number)
    : Infinity;

  // Slots that may give up their cog: unlocked, and not currently building a flag.
  const boardSlots: number[] = [];
  const movable = new Uint8Array(BOARD_SIZE);
  for (let index = 0; index < BOARD_SIZE; index++) {
    const slot = baseBoard[index];
    if (!slot || slot.flagPlaced) continue;
    if ((slot.currentAmount ?? 0) < (slot.requiredAmount ?? 0)) continue;
    boardSlots.push(index);
    movable[index] = 1;
  }
  // A swap always moves a cog on/off the board; spares are only ever the other side of one.
  const swapTargets = [...boardSlots];
  for (let index = BOARD_SIZE; index < pool.length; index++) swapTargets.push(index);

  const placement = new Int32Array(pool.length);
  for (let index = 0; index < placement.length; index++) placement[index] = index;

  const isCharacter = new Uint8Array(pool.length);
  if (characterCap !== Infinity) {
    for (let index = 0; index < cogs.length; index++) isCharacter[index] = isCharacterCog(cogs[index]) ? 1 : 0;
  }
  // Empty slots are all alike, so trading one for another scores the same and the annealer takes it.
  // Harmless to the board, but it fills the plan with steps that move nothing.
  const isBlank = new Uint8Array(pool.length);
  for (let index = 0; index < cogs.length; index++) isBlank[index] = isBlankCog(cogs[index]) ? 1 : 0;
  let charactersOnBoard = 0;
  for (let index = 0; index < BOARD_SIZE; index++) charactersOnBoard += isCharacter[placement[index]];

  const budget = iterationBudget || Math.max(0, Number(time) || 0);
  const normalizedBoard = baseBoard.map((slot: any, index: number) => ({ ...slot, cog: cogs[index] }));
  if (boardSlots.length < 2 || budget === 0) {
    return { ...applyBoardMultipliers(evaluateBoard(normalizedBoard, characters), multipliers), moves: [] };
  }

  // Squares move as one unit. positions is mutated in place as the square relocates; cogIndexes is
  // fixed and stays in piece order, so the four names always land back in the layout the game wants.
  const blocks = assembled.map((slots) => ({ cogIndexes: slots.slice(), positions: slots.slice() }));
  // Which square, if any, owns a placement position - keeps the plain swap loop off of them.
  const blockOwner = new Int32Array(pool.length).fill(-1);
  blocks.forEach((block, id) => block.positions.forEach((position) => {
    blockOwner[position] = id;
  }));
  // A square pinned by a locked or flag-building slot stays put, but still can't be picked apart.
  const movableBlocks: number[] = [];
  blocks.forEach((block, id) => {
    if (block.positions.every((position) => movable[position])) movableBlocks.push(id);
  });
  const blockAnchors: number[] = [];
  if (movableBlocks.length > 0) {
    for (let anchor = 0; anchor < BOARD_SIZE; anchor++) {
      if (!isExcogiaAnchor(anchor)) continue;
      if (EXCOGIA_OFFSETS.every((offset) => movable[anchor + offset])) blockAnchors.push(anchor);
    }
  }
  const canMoveBlocks = movableBlocks.length > 0 && blockAnchors.length > 0;

  const targetScratch = new Int32Array(4);
  const displacedScratch = new Int32Array(4);
  const vacatedScratch = new Int32Array(4);
  const undoPositions = new Int32Array(8);
  const undoCogs = new Int32Array(8);
  const undoOwners = new Int32Array(8);
  const undoPrevious = new Int32Array(4);
  let undoCount = 0;

  // Drop the square on the 2x2 at anchor, pushing whatever was there into the slots it leaves behind.
  const moveBlock = (id: number, anchor: number) => {
    const { positions, cogIndexes } = blocks[id];
    let identical = true;
    for (let i = 0; i < 4; i++) {
      const target = anchor + EXCOGIA_OFFSETS[i];
      const owner = blockOwner[target];
      if (owner !== -1 && owner !== id) return false; // never tear another square apart
      targetScratch[i] = target;
      if (target !== positions[i]) identical = false;
    }
    if (identical) return false;

    let displacedCount = 0;
    for (let i = 0; i < 4; i++) {
      if (blockOwner[targetScratch[i]] !== id) displacedScratch[displacedCount++] = placement[targetScratch[i]];
    }
    let vacatedCount = 0;
    for (let i = 0; i < 4; i++) {
      const position = positions[i];
      let covered = false;
      for (let k = 0; k < 4; k++) {
        if (targetScratch[k] === position) {
          covered = true;
          break;
        }
      }
      if (!covered) vacatedScratch[vacatedCount++] = position;
    }

    undoCount = 0;
    for (let i = 0; i < 4; i++) {
      undoPositions[undoCount] = targetScratch[i];
      undoCogs[undoCount] = placement[targetScratch[i]];
      undoOwners[undoCount] = blockOwner[targetScratch[i]];
      undoCount++;
    }
    for (let i = 0; i < vacatedCount; i++) {
      undoPositions[undoCount] = vacatedScratch[i];
      undoCogs[undoCount] = placement[vacatedScratch[i]];
      undoOwners[undoCount] = blockOwner[vacatedScratch[i]];
      undoCount++;
    }
    for (let i = 0; i < 4; i++) undoPrevious[i] = positions[i];

    for (let i = 0; i < vacatedCount; i++) blockOwner[vacatedScratch[i]] = -1;
    for (let i = 0; i < 4; i++) {
      placement[targetScratch[i]] = cogIndexes[i];
      blockOwner[targetScratch[i]] = id;
      positions[i] = targetScratch[i];
    }
    for (let i = 0; i < vacatedCount; i++) placement[vacatedScratch[i]] = displacedScratch[i];
    return true;
  }

  const revertBlockMove = (id: number) => {
    for (let i = 0; i < undoCount; i++) {
      placement[undoPositions[i]] = undoCogs[i];
      blockOwner[undoPositions[i]] = undoOwners[i];
    }
    const { positions } = blocks[id];
    for (let i = 0; i < 4; i++) positions[i] = undoPrevious[i];
  }

  // A board that already breaks the cap has to be brought into line before the search starts. The
  // search itself will not do it: characters are worth points, so dropping one always looks like a
  // loss and never gets accepted. Evict the surplus first, then the loop only has to stop the count
  // climbing back up. Characters on locked or flag-building slots cannot be moved, so a board can
  // still come out over the cap - the guard below is written to cope with that rather than deadlock.
  // Evictions are swaps like any other, so under a budget they would come out of it - and benching
  // nine characters can eat a small budget whole and hand back a board far worse than the one you
  // started with. A budgeted run treats the cap as a ceiling instead: it refuses to add characters
  // past it and otherwise leaves the count where it found it, spending the swaps on actual gains.
  let evictionSwaps = 0;
  if (swapCap === Infinity && charactersOnBoard > characterCap) {
    const benched: number[] = [];
    for (let position = BOARD_SIZE; position < placement.length; position++) {
      if (!isCharacter[placement[position]]) benched.push(position);
    }
    for (const position of boardSlots) {
      if (charactersOnBoard <= characterCap || benched.length === 0) break;
      if (evictionSwaps >= swapCap) break;
      if (!isCharacter[placement[position]] || blockOwner[position] !== -1) continue;
      const spare = benched.pop() as number;
      const evicted = placement[position];
      placement[position] = placement[spare];
      placement[spare] = evicted;
      charactersOnBoard--;
      evictionSwaps++;
    }
  }
  const searchBudget = swapCap === Infinity ? Infinity : Math.max(0, swapCap - evictionSwaps);

  const baseline = scorePlacement(placement, pool);
  const objective = makeObjective(stat, weights, baseline);
  let currentScore = objective(baseline);

  // A budgeted run searches in swap-list space rather than in board space: a state IS the list of
  // swaps, so every candidate sits inside the budget by construction and nothing has to be counted
  // or rejected. Applying k transpositions can never take more than k moves to describe, and
  // buildMoves already returns the minimum, so the plan comes back at or under the cap.
  if (searchBudget !== Infinity) {
    const budgetStart = Date.now();
    const elapsedOf = (done: number) => (iterationBudget ? done : Date.now() - budgetStart);
    const base = Int32Array.from(placement);
    const work = new Int32Array(base.length);
    // Excogia squares move as a unit of four, which no small budget can afford, so a budgeted run
    // leaves them where they are rather than spending most of the plan relocating one.
    const openFrom = boardSlots.filter((slot) => blockOwner[slot] === -1);
    const openTargets = swapTargets.filter((slot) => blockOwner[slot] === -1);

    const applyList = (list: number[][]) => {
      work.set(base);
      for (let index = 0; index < list.length; index++) {
        const [a, b] = list[index];
        const carried = work[a];
        work[a] = work[b];
        work[b] = carried;
      }
      return work;
    };
    const countIn = (target: Int32Array) => {
      let characters = 0;
      let empties = 0;
      for (let slot = 0; slot < BOARD_SIZE; slot++) {
        characters += isCharacter[target[slot]];
        empties += isBlank[target[slot]];
      }
      return { characters, empties };
    };
    const startingEmpties = countIn(base).empties;
    // A list is scored as a whole, so a swap that drags an empty inventory slot onto the board can
    // ride along with good swaps and still win on the total. The plain search refuses that move by
    // move; here the check has to be on the finished board, or the plan comes back with holes in it
    // and real cogs left in the bag.
    const scoreList = (list: number[][]) => {
      const target = applyList(list);
      const { characters, empties } = countIn(target);
      if (empties > startingEmpties) return -Infinity;
      if (characterCap !== Infinity && characters > Math.max(characterCap, charactersOnBoard)) return -Infinity;
      return objective(scorePlacement(target, pool));
    };

    let bestList: number[][] = [];
    let bestScore = currentScore;
    const report = (iterationsDone: number) => {
      if (!onProgress) return;
      onProgress({
        elapsed: Math.min(elapsedOf(iterationsDone), budget),
        budget,
        iterations: iterationsDone,
        gain: bestScore / Math.max(Math.abs(currentScore), 1e-6) - 1
      });
    };

    // Greedy best-improvement seed. One swap at a time, always the best single swap available from
    // where the list has got to, which is what makes a one-swap budget find the one swap worth doing.
    const list: number[][] = [];
    const cursor = Int32Array.from(base);
    let cursorCharacters = charactersOnBoard;
    for (let step = 0; step < searchBudget; step++) {
      // Greedy is bounded by the budget, but a wide board still makes each pass cost real time, and
      // a curve run splits one clock across several searches.
      if (elapsedOf(0) >= budget) break;
      let pickFrom = -1;
      let pickTo = -1;
      let pickScore = bestScore;
      let pickCharacters = cursorCharacters;
      for (let ai = 0; ai < openFrom.length; ai++) {
        const a = openFrom[ai];
        for (let bi = 0; bi < openTargets.length; bi++) {
          const b = openTargets[bi];
          if (a === b) continue;
          // Never bring an empty slot in from off the board: emptying a board slot is pure loss.
          if (b >= BOARD_SIZE && isBlank[cursor[b]]) continue;
          const headcount = b >= BOARD_SIZE
            ? cursorCharacters + isCharacter[cursor[b]] - isCharacter[cursor[a]]
            : cursorCharacters;
          if (characterCap !== Infinity && headcount > Math.max(characterCap, charactersOnBoard)) continue;

          const carried = cursor[a];
          cursor[a] = cursor[b];
          cursor[b] = carried;
          const score = objective(scorePlacement(cursor, pool));
          cursor[b] = cursor[a];
          cursor[a] = carried;

          if (score > pickScore) {
            pickScore = score;
            pickFrom = a;
            pickTo = b;
            pickCharacters = headcount;
          }
        }
      }
      if (pickFrom === -1) break;
      const carried = cursor[pickFrom];
      cursor[pickFrom] = cursor[pickTo];
      cursor[pickTo] = carried;
      cursorCharacters = pickCharacters;
      list.push([pickFrom, pickTo]);
      bestScore = pickScore;
      bestList = list.map(([a, b]) => [a, b]);
    }

    // Greedy is myopic: cog boosts are adjacency based, so two swaps can pay off together while
    // neither pays alone. Anneal over the list itself to find those - retarget an entry, drop one,
    // or add one while there is budget left.
    const copy = (l: number[][]) => l.map(([a, b]) => [a, b]);
    let cursorList = copy(bestList);
    let cursorScore = bestScore;
    const randomFrom = () => openFrom[(Math.random() * openFrom.length) | 0];
    const randomTo = () => openTargets[(Math.random() * openTargets.length) | 0];

    let iterations = 0;
    let elapsed = elapsedOf(0);
    let nextProgressAt = 0;
    while (elapsed < budget && openFrom.length > 0 && openTargets.length > 0 && searchBudget > 0) {
      if (iterationBudget) {
        elapsed = iterations;
      } else if ((iterations & TIME_CHECK_MASK) === 0) {
        elapsed = Date.now() - budgetStart;
      }
      if (elapsed >= nextProgressAt) {
        nextProgressAt = elapsed + PROGRESS_INTERVAL;
        report(iterations);
      }
      if (elapsed >= budget) break;
      iterations++;

      const trial = copy(cursorList);
      const roll = Math.random();
      if (roll < 0.6 && trial.length > 0) {
        trial[(Math.random() * trial.length) | 0] = [randomFrom(), randomTo()];
      } else if (roll < 0.8 && trial.length > 0) {
        trial.splice((Math.random() * trial.length) | 0, 1);
      } else if (trial.length < searchBudget) {
        trial.push([randomFrom(), randomTo()]);
      } else {
        continue;
      }

      const score = scoreList(trial);
      const temperature = START_TEMPERATURE * Math.pow(END_TEMPERATURE / START_TEMPERATURE, Math.min(1, elapsed / budget));
      const relativeDelta = (score - cursorScore) / Math.max(Math.abs(cursorScore), 1e-6);
      if (score >= cursorScore || Math.random() < Math.exp(relativeDelta / temperature)) {
        cursorList = trial;
        cursorScore = score;
        if (score > bestScore) {
          bestScore = score;
          bestList = copy(trial);
        }
      }
    }
    report(iterations);

    const { moves: budgetedMoves, placement: budgetedPlacement } = buildMoves(applyList(bestList), cogs);
    const budgetedBoard = normalizedBoard.map((slot: any, index: number) => ({
      ...slot,
      cog: cogs[budgetedPlacement[index]] ?? { name: 'Blank', stats: {}, originalIndex: index }
    }));
    return {
      ...applyBoardMultipliers(evaluateBoard(budgetedBoard, characters), multipliers),
      moves: budgetedMoves
    };
  }

  const bestPlacement = Int32Array.from(placement);
  let bestScore = currentScore;

  const startTime = Date.now();
  let elapsed = 0;
  let iterations = 0;
  let nextProgressAt = 0;
  const baselineScore = currentScore;
  const reportProgress = () => {
    if (!onProgress || elapsed < nextProgressAt) return;
    nextProgressAt = elapsed + PROGRESS_INTERVAL;
    onProgress({
      elapsed: Math.min(elapsed, budget),
      budget,
      iterations,
      gain: bestScore / Math.max(Math.abs(baselineScore), 1e-6) - 1
    });
  }

  while (elapsed < budget) {
    if (iterationBudget) {
      elapsed = iterations;
      reportProgress();
      if (elapsed >= budget) break;
    } else if ((iterations & TIME_CHECK_MASK) === 0) {
      elapsed = Date.now() - startTime;
      reportProgress();
      if (elapsed >= budget) break;
    }
    iterations++;

    let movedBlock = -1;
    let from = -1;
    let to = -1;
    let fromCog = 0;
    let toCog = 0;
    let characterDelta = 0;

    // Excogia squares never hold a character and only ever shuffle cogs between board slots, so a
    // block move cannot change the headcount and needs no check.
    if (canMoveBlocks && Math.random() < BLOCK_MOVE_CHANCE) {
      const id = movableBlocks[(Math.random() * movableBlocks.length) | 0];
      const anchor = blockAnchors[(Math.random() * blockAnchors.length) | 0];
      if (!moveBlock(id, anchor)) continue;
      movedBlock = id;
    } else {
      from = boardSlots[(Math.random() * boardSlots.length) | 0];
      to = swapTargets[(Math.random() * swapTargets.length) | 0];
      if (from === to || blockOwner[from] !== -1 || blockOwner[to] !== -1) continue;

      fromCog = placement[from];
      toCog = placement[to];
      // Never bring an empty slot in from off the board. Emptying a board slot is pure loss, and a
      // cog worth a few thousand is nothing beside a board measured in quadrillions, so the annealer
      // happily accepts it over and over and hands back a plan that strips the board for no gain.
      // The cap's eviction pass is what empties slots, once, up front. Moving a blank that is
      // already on the board is still allowed - that is just relocating a cog into the gap.
      if (to >= BOARD_SIZE && isBlank[toCog]) continue;
      // `from` is always a board slot, so the headcount only moves when the other side is a spare:
      // board-to-board just rearranges whoever is already out there.
      if (characterCap !== Infinity && to >= BOARD_SIZE) {
        characterDelta = isCharacter[toCog] - isCharacter[fromCog];
        // Only refuse moves that add a character past the cap. Swaps that keep the count level or
        // bring it down stay legal even on a board held over the cap by pinned slots.
        if (characterDelta > 0 && charactersOnBoard + characterDelta > characterCap) continue;
      }
      placement[from] = toCog;
      placement[to] = fromCog;
      charactersOnBoard += characterDelta;
    }

    const score = objective(scorePlacement(placement, pool));
    const delta = score - currentScore;
    // Simulated annealing: early on take the occasional loss to climb out of local optima, then
    // cool down to a plain hill climb. The best placement seen is kept regardless.
    const temperature = START_TEMPERATURE * Math.pow(END_TEMPERATURE / START_TEMPERATURE, Math.min(1, elapsed / budget));
    // Relative so the same schedule works for raw stat totals and for the normalised weighted score.
    const relativeDelta = delta / Math.max(Math.abs(currentScore), 1e-6);

    if (delta >= 0 || Math.random() < Math.exp(relativeDelta / temperature)) {
      currentScore = score;
      if (score > bestScore) {
        bestScore = score;
        bestPlacement.set(placement);
      }
    } else if (movedBlock >= 0) {
      revertBlockMove(movedBlock);
    } else {
      placement[from] = fromCog;
      placement[to] = toCog;
      charactersOnBoard -= characterDelta;
    }
  }

  const { moves, placement: finalPlacement } = buildMoves(bestPlacement, cogs);
  const optimizedBoard = normalizedBoard.map((slot: any, index: number) => ({
    ...slot,
    cog: cogs[finalPlacement[index]] ?? { name: 'Blank', stats: {}, originalIndex: index }
  }));
  return {
    ...applyBoardMultipliers(evaluateBoard(optimizedBoard, characters), multipliers),
    moves
  };
}

/**
 * The swap budget worth setting is the one nobody knows up front: the worthwhile swaps might run out
 * at three or at fifteen. So run a handful of budgets plus the unbudgeted search, and let the caller
 * show what each one actually buys. The single time budget is split across the runs rather than
 * spent on each, so a curve costs about what one search used to.
 */
export const optimizeSwapCurve = (arr: any[], options: SwapCurveOptions = {}) => {
  const { swapBudgets, time = 2500, maxIterations, onProgress, stat = 'totalBuildRate', weights, ...rest } = options;
  const budgets = [...new Set((swapBudgets ?? DEFAULT_SWAP_BUDGETS).map((value) => Math.trunc(value)))]
    .filter((value) => value > 0)
    .sort((left, right) => left - right);

  const shared = { ...rest, stat, weights };
  const current = optimizeArrayWithSwaps(arr, { ...shared, time: 0 });
  // Gain is measured with the same objective the search optimises, so a weighted run reports the
  // weighted improvement rather than whichever single stat happens to be biggest.
  const objective = makeObjective(stat, weights, current);
  const reference = objective(current);
  const gainOf = (totals: any) => (Math.abs(reference) > 1e-6 ? objective(totals) / reference - 1 : 0);

  const iterationBudget = Number.isFinite(maxIterations as number) && (maxIterations as number) > 0
    ? Math.trunc(maxIterations as number)
    : 0;
  const totalBudget = iterationBudget || Math.max(0, Number(time) || 0);
  // A wide search has more ground to cover than a narrow one - the greedy seed alone is one pass per
  // swap of budget - so an even split starves exactly the runs that need the time. Weight each run's
  // share by its budget instead, with the unbudgeted run treated as the widest.
  const widest = Math.max(1, ...budgets);
  const shares = [...budgets, widest];
  const totalShares = shares.reduce((sum, share) => sum + share, 0);
  const budgetFor = (index: number) => (totalBudget * shares[index]) / totalShares;

  let spent = 0;
  const forward = onProgress
    ? (progress: OptimizeProgress) => onProgress({
      elapsed: Math.min(totalBudget, spent + progress.elapsed),
      budget: totalBudget,
      iterations: progress.iterations,
      gain: progress.gain
    })
    : undefined;

  const run = (maxSwaps: number | null, index: number) => {
    const share = budgetFor(index);
    const result = optimizeArrayWithSwaps(arr, {
      ...shared,
      ...(iterationBudget ? { maxIterations: Math.max(1, Math.trunc(share)) } : { time: share }),
      ...(maxSwaps === null ? {} : { maxSwaps }),
      onProgress: forward
    });
    spent += share;
    return { ...result, maxSwaps, gain: gainOf(result) };
  };

  const entries = budgets.map((maxSwaps, index) => run(maxSwaps, index));
  // The unbudgeted search has no greedy seed, so on a tight clock a budgeted run can beat it. An
  // unlimited budget can afford any of those plans, so take the best one found rather than only its
  // own - otherwise the widest option on screen sits below a narrower one for no reason a reader
  // could follow.
  const searched = run(null, budgets.length);
  const best = entries.reduce((winner, entry) => (entry.gain > winner.gain ? entry : winner), searched);
  // When a budget won, the unbudgeted slot is showing that same board under a second name. Say so,
  // rather than leaving the caller to compare gains and guess.
  const unlimited = { ...best, maxSwaps: null, redundant: best !== searched };
  onProgress?.({ elapsed: totalBudget, budget: totalBudget, iterations: 0, gain: unlimited.gain });

  return { current, entries, unlimited };
}

// A budget inside this much of the best gain on offer counts as "all of it" - past the knee the
// curve is flat and the extra swaps buy rounding error.
const VALUE_THRESHOLD = 0.95;

/**
 * The plans worth showing: every budget, plus the unbudgeted plan only when it is its own board
 * rather than a second name for a budget that already found it.
 */
export const curvePlans = (curve: { entries?: any[]; unlimited?: any } | null | undefined) => {
  const { entries = [], unlimited } = curve ?? {};
  return unlimited && !unlimited.redundant ? [...entries, unlimited] : [...entries];
}

/**
 * Which plan on the curve to put in front of the user. Left on the unbudgeted plan the curve is just
 * extra reading, so pick the cheapest budget that already gets effectively the whole gain, and fall
 * back to the unbudgeted plan when no budget comes close.
 */
export const bestValuePlan = (curve: { entries: any[]; unlimited: any }) => {
  const { entries = [], unlimited } = curve ?? {} as any;
  // A redundant unbudgeted plan is not on screen, so falling back to it would leave the picker with
  // nothing selected. The budget it copied is the same board under a name the reader can see.
  const fallback = unlimited?.redundant
    ? entries.reduce((winner, entry) => ((entry.gain ?? 0) > (winner?.gain ?? -Infinity) ? entry : winner), entries[0])
    : unlimited;
  const best = Math.max(unlimited?.gain ?? 0, ...entries.map(({ gain }) => gain ?? 0));
  if (!(best > 0)) return fallback;
  const target = best * VALUE_THRESHOLD;
  return [...entries]
    .sort((left, right) => left.maxSwaps - right.maxSwaps)
    .find(({ gain, moves }) => (gain ?? 0) >= target && moves?.length > 0) ?? fallback;
}

/**
 * The board as it looks once the first `count` moves have been made in game. Replays the swap
 * sequence onto the starting pool so a half-finished board is rendered and scored exactly the same
 * way the finished one is. count 0 gives the board back untouched, count >= moves.length gives the
 * optimized board.
 */
export const getBoardAtStep = (baseBoard: any[], spareCogs: any[], moves: OptimizeMove[], count: number, characters?: any[]) => {
  const board = baseBoard || [];
  const cogs = normalizeCogs(board, spareCogs || []);
  const placement = cogs.map((_, index) => index);
  const limit = Math.max(0, Math.min(Math.trunc(count) || 0, moves?.length ?? 0));
  for (let step = 0; step < limit; step++) {
    const { from, to } = moves[step];
    const carried = placement[from];
    placement[from] = placement[to];
    placement[to] = carried;
  }
  const stepBoard = board.map((slot: any, index: number) => ({
    ...slot,
    cog: cogs[placement[index]] ?? { name: 'Blank', stats: {}, originalIndex: index }
  }));
  return evaluateBoard(stepBoard, characters);
}

export const evaluateBoard = (currentBoard: any[], characters?: any[]) => {
  const board = currentBoard || [];
  const pool = board.map((slot: any) => compileCog(slot?.cog, characters));
  const placement = new Int32Array(pool.length);
  for (let index = 0; index < placement.length; index++) placement[index] = index;
  const totals = scorePlacement(placement, pool);
  const { boosted, relations } = getAllBoostedCogs(board);

  // Invert relations once instead of scanning it per slot.
  const affectsByIndex: Record<number, number[]> = {};
  Object.entries(relations).forEach(([affectedIndex, affectingIndices]) => {
    (affectingIndices as number[]).forEach((affectingIndex) => {
      (affectsByIndex[affectingIndex] = affectsByIndex[affectingIndex] || []).push(parseInt(affectedIndex));
    });
  });

  const expMulti = 1 + totals.totalExpRate / 100;
  const updatedBoard = board.map((slot: any, index: number) => {
    const { cog } = slot || {};
    const {
      e: boostedBuildRate,
      g: boostedFlaggyRate,
      f: boostedPlayerExp,
      j: boostedFlagSpeed
    } = boosted?.[index] || {};
    const stats: any = {
      ...cog?.stats,
      a: { ...cog?.stats?.a, value: (cog?.stats?.a?.value || 0) * (1 + (boostedBuildRate?.value || 0) / 100) },
      c: { ...cog?.stats?.c, value: (cog?.stats?.c?.value || 0) * (1 + (boostedFlaggyRate?.value || 0) / 100) }
    };
    if (pool[index]?.playerBase) {
      stats.b = {
        ...cog?.stats?.b,
        value: pool[index].playerBase * (1 + (boostedPlayerExp?.value || 0) / 100) * expMulti
      };
    }
    return {
      ...slot,
      cog: { ...cog, stats },
      flagSpeedBoost: slot?.flagPlaced ? 1 + (boostedFlagSpeed?.value || 0) / 100 : 0,
      affectedBy: relations?.[index] || [],
      affects: affectsByIndex[index] || []
    };
  });

  return { ...totals, board: updatedBoard };
}

export const getAllBoostedCogs = (board: any[]) => {
  const relations: Record<number, any[]> = {};
  let boosted = new Array(BOARD_X * BOARD_Y).fill(0);
  for (let y = 0; y < BOARD_Y; y++) {
    for (let x = 0; x < BOARD_X; x++) {
      const index = (7 - y) * 12 + x;
      const currentCog = board?.[index]?.cog;
      const currentCogStats = board?.[index]?.cog?.stats || {};
      let affected: any = getAffectedIndexes(currentCog, x, y);
      if (affected?.length > 0) {
        affected = (affected as any[])?.map(([x, y]: any) => (x < 0 || y < 0 || x >= BOARD_X || y >= BOARD_Y)
          ? null
          : (7 - y) * 12 + x)?.filter((num: any) => num !== null) as number[];
        const { e, f, g, j } = currentCogStats || {};
        if (e || f || g || j) {
          for (let i = 0; i < affected.length; i++) {
            const affectedIndex = affected[i] as number;
            const { e, f, g, j } = currentCogStats;
            if (boosted?.[affectedIndex] === 0) {
              boosted[affectedIndex] = {
                e: { value: e?.value || 0 },
                f: { value: f?.value || 0 },
                g: { value: g?.value || 0 },
                j: { value: j?.value || 0 }
              }
            } else {
              const { e: curE, f: curF, g: curG, j: curJ } = boosted[affectedIndex] || {};
              boosted[affectedIndex] = {
                e: { ...curE, value: (curE?.value || 0) + (e?.value || 0) },
                f: { ...curF, value: (curF?.value || 0) + (f?.value || 0) },
                g: { ...curG, value: (curG?.value || 0) + (g?.value || 0) },
                j: { ...curJ, value: (curJ?.value || 0) + (j?.value || 0) }
              }
            }
            relations[affectedIndex] = [...(relations[affectedIndex] || []), index];
          }
        }
      }
    }
  }

  return {
    boosted,
    relations
  }
}

export const getAffectedIndexes = (currentCog: any, x: number, y: number) => {
  const affected = [];
  switch (currentCog?.stats?.h) {
    case 'diagonal':
      affected.push([x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]);
      break;
    case 'adjacent':
      affected.push([x - 1, y], [x, y + 1], [x + 1, y], [x, y - 1]);
      break;
    case 'up':
      affected.push([x - 1, y + 2], [x, y + 2], [x + 1, y + 2], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]);
      break;
    case 'right':
      affected.push([x + 2, y - 1], [x + 2, y], [x + 2, y + 1], [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]);
      break;
    case 'down':
      affected.push([x - 1, y - 2], [x, y - 2], [x + 1, y - 2], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1]);
      break;
    case 'left':
      affected.push([x - 2, y - 1], [x - 2, y], [x - 2, y + 1], [x - 1, y - 1], [x - 1, y], [x - 1, y + 1]);
      break;
    case 'row':
      for (let k = 0; k < BOARD_X; k++) {
        if (x === k) continue;
        affected.push([k, y]);
      }
      break;
    case 'column':
      for (let k = 0; k < BOARD_Y; k++) {
        if (y === k) continue;
        affected.push([x, k]);
      }
      break;
    case 'corners':
      affected.push([x - 2, y - 2], [x + 2, y - 2], [x - 2, y + 2], [x + 2, y + 2]);
      break;
    case 'around':
      affected.push([x, y - 2], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 2, y], [x - 1, y], [x + 1, y],
        [x + 2, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1], [x, y + 2]);
      break;
    case 'everything':
      for (let l = 0; l < BOARD_Y; l++) {
        for (let k = 0; k < BOARD_X; k++) {
          if (y === l && x === k) continue;
          affected.push([k, l]);
        }
      }
      break;
    default:
      break;
  }
  return affected;
}
