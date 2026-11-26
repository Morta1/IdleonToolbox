// Research Optimizer: where to put the grid shapes and the observation lenses.
// Pure math on a plain input (built by getResearchOptimizerInput in research.ts), so it runs in a Web Worker.
// Game: ActorEvents_741 (the Research screen), ResearchStuff("Grid_ShapeVertices"), IsPointInPolygon.

export const GRID_COLUMNS = 20;
export const GRID_CELLS = 240;
// Drag limits of a shape's unrotated box: 10 <= x, x + w <= 616, 20 <= y, y + h <= 375.
export const SHAPE_BOUNDS = { minX: 10, maxX: 616, minY: 20, maxY: 375 };
// Turn buttons move a shape 5 degrees a press (right +5, left -5); turning unlocks at Research LV 90.
export const TURN_STEP = 5;

export type Point = [number, number];

export interface ShapeCatalogEntry {
  polygon: Point[];
  width: number;
  height: number;
  bonusPct: number;
}

export interface ShapePlacement {
  shape: number;
  x: number;
  y: number;
  rot: number;
}

export const parseShapeCatalog = (polygons: string[] = [], dims: string[] = [], bonusPcts: (string | number)[] = []): ShapeCatalogEntry[] =>
  polygons.map((polygon, index) => {
    const [width, height] = String(dims[index] ?? '0,0').split(',').map(Number);
    return {
      polygon: String(polygon).split(';').map((pair) => pair.split(',').map(Number) as Point),
      width,
      height,
      bonusPct: Number(bonusPcts[index]) || 0
    };
  });

// game: Grid_ShapeVertices - each vertex turned around the box centre, rounded
export const getShapeVertices = (entry: ShapeCatalogEntry, { x, y, rot }: ShapePlacement): Point[] => {
  const cx = entry.width / 2;
  const cy = entry.height / 2;
  const angle = 0.01745329251994278 * rot;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return entry.polygon.map(([px, py]) => [
    Math.round(cx + x + (px - cx) * cos - (py - cy) * sin),
    Math.round(cy + y + (px - cx) * sin + (py - cy) * cos)
  ]);
};

// game: IsPointInPolygon, an even-odd ray cast
export const isPointInPolygon = (px: number, py: number, polygon: Point[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// The 4 points the game tests for each grid node: 3 px in from its corners on a 30 px pitch.
const nodePoints = (node: number): Point[] => {
  const col = node % GRID_COLUMNS;
  const row = Math.floor(node / GRID_COLUMNS);
  return [0, 1, 2, 3].map((t) => [
    Math.round(15 + 30 * col + (3 + 21 * (t % 2))),
    Math.round(24 + 30 * row + (3 + 21 * Math.floor(t / 2)))
  ]);
};
const NODE_POINTS = Array.from({ length: GRID_CELLS }, (_, node) => nodePoints(node));

// The selectable nodes a shape at this placement touches: any of a node's 4 points inside the polygon.
export const getCoveredNodes = (entry: ShapeCatalogEntry, placement: ShapePlacement, selectable: boolean[]) => {
  const vertices = getShapeVertices(entry, placement);
  const xs = vertices.map(([vx]) => vx);
  const ys = vertices.map(([, vy]) => vy);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const covered: number[] = [];
  for (let node = 0; node < GRID_CELLS; node++) {
    if (!selectable[node]) continue;
    const points = NODE_POINTS[node];
    if (points[3][0] < minX || points[0][0] > maxX || points[3][1] < minY || points[0][1] > maxY) continue;
    if (points.some(([px, py]) => isPointInPolygon(px, py, vertices))) covered.push(node);
  }
  return covered;
};

export const isInsideDragBounds = (entry: ShapeCatalogEntry, { x, y }: ShapePlacement) =>
  x >= SHAPE_BOUNDS.minX && x + entry.width <= SHAPE_BOUNDS.maxX && y >= SHAPE_BOUNDS.minY && y + entry.height <= SHAPE_BOUNDS.maxY;

export interface ShapeMove extends ShapePlacement {
  covered: number[];
}

/**
 * Node owners after moving shapes one at a time, the game's way: a moved shape lets go of its nodes, each goes to
 * the lowest-numbered shape that covers it, then the moved shape takes only the nodes no shape holds. Turning alone
 * changes nothing; only a drag re-assigns nodes. owners[node] = shape index or -1.
 */
export const applyShapeMoves = (owners: number[], coverage: number[][], moves: ShapeMove[]) => {
  const result = owners.slice();
  const covers = coverage.map((nodes) => new Set(nodes));
  for (const move of moves) {
    const released: number[] = [];
    for (let node = 0; node < result.length; node++) {
      if (result[node] === move.shape) {
        result[node] = -1;
        released.push(node);
      }
    }
    covers[move.shape] = new Set(move.covered);
    for (const node of released) {
      const taker = covers.findIndex((nodes) => nodes.has(node));
      if (taker >= 0) result[node] = taker;
    }
    for (const node of move.covered) if (result[node] < 0) result[node] = move.shape;
  }
  return result;
};

// Presses of the turn buttons from one angle to another, the shorter way round, and which button.
export const getTurnPresses = (from: number, to: number) => {
  const steps = 360 / TURN_STEP;
  const forward = ((Math.round((to - from) / TURN_STEP) % steps) + steps) % steps;
  return forward <= steps - forward ? { presses: forward, button: 'right' as const } : { presses: steps - forward, button: 'left' as const };
};

// The game's coordinate label for a node, as on its tile: a letter per column and the row counted from the bottom.
export const getGridLabel = (node: number, rows = GRID_CELLS / GRID_COLUMNS) =>
  `${String.fromCharCode(65 + (node % GRID_COLUMNS))}${rows - Math.floor(node / GRID_COLUMNS)}`;

// ---------------------------------------------------------------------------------------------------------------
// Scoring: Research EXP per hour for a set of node owners and lens slots (game: ResearchStuff "ResearchEXPrateTOT").

export const LENS = { glass: 0, monocle: 1, kaleidoscope: 2 } as const;

export interface LensSlot {
  observation: number;
  type: number;
}

export interface ResearchOptimizerInput {
  shapesOwned: number;
  canRotate: boolean;
  placements: ShapePlacement[];
  owners: number[];
  selectable: boolean[];
  levels: number[];
  // Each node's mode-0 bonus without its shape's multiplier
  nodeValue: number[];
  shapeCatalog: { polygons: string[]; dims: string[]; bonusPcts: (string | number)[] };
  totalOccurrencesFound: number;
  expAdditive: number;
  expGrid70: number;
  expMulti: number;
  observationsFound: number;
  insightLevels: number[];
  insightExp: number[];
  lensSlots: LensSlot[];
  lensCap: number;
  // Kalei_MultiBase without grid 52 and 72, in percent
  kaleiOther: number;
  // ObservationInsightExpRate per monocle without grid 91 / 92 and the kaleidoscope multi
  monocleRate: number;
  afkRatePct: number;
}

// ResearchEXPmulti's additive sum reads these nodes (mode 2 for 94 and 112), and grid 70 is a factor of its own.
const EXP_SUM_NODES = [31, 50, 51, 90, 94, 110, 112];
const EXP_FACTOR_NODE = 70;
// Nodes the lenses read: 93 scales a glass by its observation's Insight level, 52 and 72 feed the kaleidoscope.
const LENS_NODES = [52, 72, 93];
export const RESEARCH_EXP_NODES = [...EXP_SUM_NODES, EXP_FACTOR_NODE, ...LENS_NODES];
// Insight: 91 and 92 multiply every monocle, 52 and 72 the kaleidoscopes next to them.
export const INSIGHT_NODES = [52, 72, 91, 92];

export type ResearchGoal = 'researchExp' | 'insight';
export const GOAL_NODES: Record<ResearchGoal, number[]> = { researchExp: RESEARCH_EXP_NODES, insight: INSIGHT_NODES };

// game: ResearchStuff("ResearchEXPrateObj") before its count and multipliers
export const getObservationBaseRate = (i: number) =>
  (4 + (i / 2 + Math.floor(i / 4))) * (1 + Math.pow(i, 1 + (i / 15) * 0.4) / 10) + (Math.pow(i, 1.5) + 1.5 * i);

// game: ResearchStuff("ObservationInsightExpREQ")
export const getInsightExpReq = (i: number, level: number) =>
  (2 + 0.7 * i) * Math.pow(1.75 + i / 200, level) * (1 + Math.pow(i, 2) / 100) + level;

// Kaleidoscopes boost the observation left, right, above and below them on the 8-wide board.
export const getKaleidoscopeNeighbours = (observation: number) => [
  observation % 8 !== 7 ? observation + 1 : -1,
  observation % 8 !== 0 ? observation - 1 : -1,
  observation > 7 ? observation - 8 : -1,
  observation < 72 ? observation + 8 : -1
].filter((n) => n >= 0);

const countLenses = (slots: LensSlot[]) => {
  const glasses = new Map<number, number>();
  const monocles = new Map<number, number>();
  const kaleidoscopes = new Map<number, number>();
  for (const { observation, type } of slots) {
    if (observation < 0) continue;
    if (type === LENS.glass) glasses.set(observation, (glasses.get(observation) ?? 0) + 1);
    else if (type === LENS.monocle) monocles.set(observation, (monocles.get(observation) ?? 0) + 1);
    else for (const n of getKaleidoscopeNeighbours(observation)) kaleidoscopes.set(n, (kaleidoscopes.get(n) ?? 0) + 1);
  }
  return { glasses, monocles, kaleidoscopes };
};

export const createResearchScorer = (input: ResearchOptimizerInput) => {
  const catalog = parseShapeCatalog(input.shapeCatalog.polygons, input.shapeCatalog.dims, input.shapeCatalog.bonusPcts);
  const pct = (shape: number) => (shape >= 0 ? catalog[shape]?.bonusPct ?? 0 : 0);
  const shaped = (owners: number[], node: number) => (input.nodeValue[node] ?? 0) * (1 + pct(owners[node]) / 100);
  const totalLevels = (levels: number[]) =>
    levels.slice(0, input.observationsFound).reduce((sum, level) => sum + (level >= 1 ? level : 0), 0);
  const sumPart = (owners: number[], levels: number[]) => EXP_SUM_NODES.reduce((sum, node) => {
    const count = node === 94 ? totalLevels(levels) : node === 112 ? input.totalOccurrencesFound : 1;
    return sum + shaped(owners, node) * count;
  }, 0);
  const otherAdditive = input.expAdditive - sumPart(input.owners, input.insightLevels);
  const restMulti = input.expMulti / ((1 + input.expAdditive / 100) * (1 + input.expGrid70 / 100) || 1);

  const expMulti = (owners: number[], levels: number[]) =>
    (1 + (otherAdditive + sumPart(owners, levels)) / 100) * (1 + shaped(owners, EXP_FACTOR_NODE) / 100) * restMulti;
  const kaleiBase = (owners: number[]) => (input.kaleiOther + shaped(owners, 52) + shaped(owners, 72)) / 100;

  // Research EXP per hour of research time
  const expRate = (owners: number[], slots: LensSlot[], levels = input.insightLevels) => {
    const { glasses, kaleidoscopes } = countLenses(slots);
    const g93 = shaped(owners, 93);
    const base = kaleiBase(owners);
    let rate = 0;
    glasses.forEach((count, i) => {
      if (i >= input.observationsFound) return;
      rate += count * getObservationBaseRate(i) * (1 + (g93 * (levels[i] ?? 0)) / 100) * (1 + (kaleidoscopes.get(i) ?? 0) * base);
    });
    return rate * expMulti(owners, levels);
  };

  // Insight EXP per hour of research time on each observation
  const insightRates = (owners: number[], slots: LensSlot[]) => {
    const { monocles, kaleidoscopes } = countLenses(slots);
    const perMonocle = input.monocleRate * (1 + (shaped(owners, 91) + shaped(owners, 92)) / 100);
    const base = kaleiBase(owners);
    const rates = new Map<number, number>();
    monocles.forEach((count, i) => rates.set(i, count * perMonocle * (1 + (kaleidoscopes.get(i) ?? 0) * base)));
    return rates;
  };

  // Insight levels after `hours` of research time with these lenses
  const insightLevelsAfter = (owners: number[], slots: LensSlot[], hours: number) => {
    const levels = input.insightLevels.slice();
    insightRates(owners, slots).forEach((rate, i) => {
      if (i >= input.observationsFound) return;
      let exp = (input.insightExp[i] ?? 0) + rate * hours;
      while (exp >= getInsightExpReq(i, levels[i] ?? 0)) {
        exp -= getInsightExpReq(i, levels[i] ?? 0);
        levels[i] = (levels[i] ?? 0) + 1;
      }
    });
    return levels;
  };

  // All Insight EXP per hour of research time, across the observations
  const insightRate = (owners: number[], slots: LensSlot[]) => [...insightRates(owners, slots).values()].reduce((sum, rate) => sum + rate, 0);
  const goalRate = (goal: ResearchGoal, owners: number[], slots: LensSlot[]) =>
    (goal === 'insight' ? insightRate(owners, slots) : expRate(owners, slots));

  return { catalog, pct, shaped, expMulti, expRate, insightRates, insightRate, insightLevelsAfter, goalRate };
};

// ---------------------------------------------------------------------------------------------------------------
// Shape search: the best layout for 1, 2, ... moves, moving as few shapes as the gain allows.

export interface ShapeStep {
  shape: number;
  from: ShapePlacement;
  to: ShapePlacement;
  turn: { presses: number; button: 'left' | 'right' };
  holds: number[];
}

export interface ShapePlan {
  moves: number;
  ratio: number;
  steps: ShapeStep[];
  owners: number[];
}

const POSITION_STEP = 6;
const ANGLE_STEP = 15;

export const getShapeCandidates = (input: ResearchOptimizerInput, catalog: ShapeCatalogEntry[], shape: number) => {
  const entry = catalog[shape];
  const current = input.placements[shape];
  const angles = input.canRotate ? Array.from({ length: 360 / ANGLE_STEP }, (_, i) => i * ANGLE_STEP) : [current.rot];
  const seen = new Set<string>();
  const candidates: ShapeMove[] = [];
  for (const rot of angles) {
    for (let x = SHAPE_BOUNDS.minX; x + entry.width <= SHAPE_BOUNDS.maxX; x += POSITION_STEP) {
      for (let y = SHAPE_BOUNDS.minY; y + entry.height <= SHAPE_BOUNDS.maxY; y += POSITION_STEP) {
        const covered = getCoveredNodes(entry, { shape, x, y, rot }, input.selectable);
        if (!covered.some((node) => input.levels[node] > 0)) continue;
        const key = covered.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({ shape, x, y, rot, covered });
      }
    }
  }
  return candidates;
};

export const optimizeShapes = (input: ResearchOptimizerInput, {
  goal = 'researchExp',
  maxMoves = input.shapesOwned,
  beamWidth = 8,
  onProgress
}: { goal?: ResearchGoal; maxMoves?: number; beamWidth?: number; onProgress?: (share: number) => void } = {}) => {
  const scorer = createResearchScorer(input);
  const { catalog, pct } = scorer;
  const shapes = Array.from({ length: input.shapesOwned }, (_, shape) => shape);
  const coverage = shapes.map((shape) => getCoveredNodes(catalog[shape], input.placements[shape], input.selectable));
  // Building the candidates is about a fifth of the run; the moves share the rest.
  const candidates = shapes.map((shape) => {
    const list = getShapeCandidates(input, catalog, shape);
    onProgress?.((0.2 * (shape + 1)) / shapes.length);
    return list;
  });
  // Spare shapes break ties: once the goal is maxed, a shape on more levelled nodes beats one on none.
  const spare = (owners: number[]) => owners.reduce((sum, shape, node) =>
    sum + (shape >= 0 && input.levels[node] > 0 && !GOAL_NODES[goal].includes(node) ? pct(shape) : 0), 0);
  const rate = (owners: number[]) => scorer.goalRate(goal, owners, input.lensSlots);
  const value = (owners: number[]) => rate(owners) * (1 + 1e-7 * spare(owners));
  const now = rate(input.owners);

  type Node = { moves: ShapeMove[]; owners: number[]; v: number };
  let beam: Node[] = [{ moves: [], owners: input.owners, v: value(input.owners) }];
  const plans: ShapePlan[] = [];
  const limit = Math.min(maxMoves, shapes.length);
  for (let k = 1; k <= limit; k++) {
    const next: Node[] = [];
    for (const node of beam) {
      const used = new Set(node.moves.map(({ shape }) => shape));
      for (const shape of shapes) {
        if (used.has(shape)) continue;
        for (const candidate of candidates[shape]) {
          const moves = [...node.moves, candidate];
          const owners = applyShapeMoves(input.owners, coverage, moves);
          next.push({ moves, owners, v: value(owners) });
        }
      }
    }
    next.sort((a, b) => b.v - a.v);
    beam = next.slice(0, k === 1 ? beamWidth * 4 : beamWidth);
    const best = beam[0];
    if (!best) break;
    plans.push({
      moves: k,
      ratio: rate(best.owners) / (now || 1),
      owners: best.owners,
      steps: best.moves.map(({ shape, x, y, rot }) => ({
        shape,
        from: input.placements[shape],
        to: { shape, x, y, rot },
        turn: getTurnPresses(input.placements[shape].rot, rot),
        holds: best.owners.flatMap((owner, node) => (owner === shape && input.levels[node] > 0 ? [node] : []))
      }))
    });
    onProgress?.(0.2 + (0.8 * k) / limit);
  }
  return { now, plans };
};

// ---------------------------------------------------------------------------------------------------------------
// Lens search: lens counts are fixed by their sources, so only where each one sits changes.

export interface LensDrag {
  type: number;
  from: number;
  to: number;
  count: number;
}

export interface LensPlan {
  hours: number;
  slots: LensSlot[];
  ratioToday: number;
  ratioAtHorizon: number;
  insightLevelsGained: number;
  drags: LensDrag[];
}

// Insight only grows during research time, which builds at the AFK rate while the player is away.
export const getResearchHours = (input: ResearchOptimizerInput, realHours: number) =>
  realHours * Math.min(1, Math.max(0, input.afkRatePct) / 100);

const lensCounts = (slots: LensSlot[]) => {
  const counts = new Map<number, number>();
  for (const { observation } of slots) if (observation >= 0) counts.set(observation, (counts.get(observation) ?? 0) + 1);
  return counts;
};

const fitsCap = (slots: LensSlot[], cap: number) => [...lensCounts(slots).values()].every((count) => count <= cap);

// A small seeded generator, so the same save always gets the same plan.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/**
 * The drags that turn one layout into another, ordered so each lands where there is room: a lens dropped on a full
 * observation knocks a random one off (game: MagnifiersPerSlot check in ActorEvents_741).
 */
export const getLensDrags = (from: LensSlot[], to: LensSlot[], cap: number) => {
  const pending: LensDrag[] = [];
  for (const type of [LENS.glass, LENS.monocle, LENS.kaleidoscope]) {
    const before = lensCounts(from.filter((slot) => slot.type === type));
    const after = lensCounts(to.filter((slot) => slot.type === type));
    const sources: number[] = [];
    const targets: number[] = [];
    new Set([...before.keys(), ...after.keys()]).forEach((observation) => {
      const diff = (after.get(observation) ?? 0) - (before.get(observation) ?? 0);
      for (let i = 0; i < Math.abs(diff); i++) (diff > 0 ? targets : sources).push(observation);
    });
    sources.forEach((source, i) => {
      const target = targets[i];
      const last = pending[pending.length - 1];
      if (last && last.type === type && last.from === source && last.to === target) last.count += 1;
      else pending.push({ type, from: source, to: target, count: 1 });
    });
  }
  const ordered: LensDrag[] = [];
  const counts = lensCounts(from);
  while (pending.length) {
    const index = Math.max(0, pending.findIndex(({ to, count }) => (counts.get(to) ?? 0) + count <= cap));
    const [drag] = pending.splice(index, 1);
    counts.set(drag.from, (counts.get(drag.from) ?? 0) - drag.count);
    counts.set(drag.to, (counts.get(drag.to) ?? 0) + drag.count);
    ordered.push(drag);
  }
  return ordered;
};

// What a lens layout is worth for a goal: Insight as it runs today, Research EXP at the horizon with the Insight levels
// the lenses earn by then.
export const scoreLensLayout = (input: ResearchOptimizerInput, layout: LensSlot[], {
  goal = 'researchExp',
  realHours = 0,
  owners = input.owners,
  scorer = createResearchScorer(input)
}: { goal?: ResearchGoal; realHours?: number; owners?: number[]; scorer?: ReturnType<typeof createResearchScorer> } = {}) => {
  const hours = getResearchHours(input, realHours);
  return goal === 'insight'
    ? scorer.insightRate(owners, layout)
    : scorer.expRate(owners, layout, hours > 0 ? scorer.insightLevelsAfter(owners, layout, hours) : input.insightLevels);
};

// The layout after the first drags of a plan
export const applyLensDrags = (slots: LensSlot[], drags: LensDrag[]) => {
  const layout = slots.map((slot) => ({ ...slot }));
  for (const { type, from, to, count } of drags) {
    for (let n = 0; n < count; n++) {
      const slot = layout.find((item) => item.type === type && item.observation === from);
      if (slot) slot.observation = to;
    }
  }
  return layout;
};

export const optimizeLenses = (input: ResearchOptimizerInput, {
  goal = 'researchExp',
  realHours = 0,
  owners = input.owners,
  keepMonocles = false,
  restarts = 40
}: { goal?: ResearchGoal; realHours?: number; owners?: number[]; keepMonocles?: boolean; restarts?: number } = {}): LensPlan => {
  const scorer = createResearchScorer(input);
  const hours = getResearchHours(input, realHours);
  const found = input.observationsFound;
  const slots = input.lensSlots.filter(({ observation }) => observation >= 0 && observation < found);
  const score = (layout: LensSlot[]) => scoreLensLayout(input, layout, { goal, realHours, owners, scorer });
  const today = (layout: LensSlot[]) => scorer.goalRate(goal, owners, layout);
  const movable = (slot: LensSlot) => !(keepMonocles && slot.type === LENS.monocle);
  const random = seeded(found * 7919 + slots.length);

  const climb = (start: LensSlot[]) => {
    let layout = start.map((slot) => ({ ...slot }));
    let value = score(layout);
    for (let improved = true; improved;) {
      improved = false;
      for (let i = 0; i < layout.length; i++) {
        if (!movable(layout[i])) continue;
        for (let observation = 0; observation < found; observation++) {
          if (observation === layout[i].observation) continue;
          const trial = layout.map((slot) => ({ ...slot }));
          trial[i].observation = observation;
          if (!fitsCap(trial, input.lensCap)) {
            // Swap with a lens of another kind already there
            const j = trial.findIndex((slot, k) => k !== i && slot.observation === observation && slot.type !== trial[i].type && movable(slot));
            if (j < 0) continue;
            trial[j].observation = layout[i].observation;
            if (!fitsCap(trial, input.lensCap)) continue;
          }
          const trialValue = score(trial);
          if (trialValue > value * (1 + 1e-12)) {
            layout = trial;
            value = trialValue;
            improved = true;
          }
        }
      }
    }
    return { layout, value };
  };

  let best = climb(slots);
  for (let r = 0; r < restarts; r++) {
    const start = slots.map((slot) => ({ ...slot }));
    for (let j = 0; j < start.length * 2; j++) {
      const i = Math.floor(random() * start.length);
      if (!movable(start[i])) continue;
      const trial = start.map((slot) => ({ ...slot }));
      trial[i].observation = Math.floor(random() * found);
      if (fitsCap(trial, input.lensCap)) start.splice(0, start.length, ...trial);
    }
    const result = climb(start);
    if (result.value > best.value * (1 + 1e-12)) best = result;
  }

  const levelsNow = hours > 0 ? scorer.insightLevelsAfter(owners, slots, hours) : input.insightLevels;
  const levelsBest = hours > 0 ? scorer.insightLevelsAfter(owners, best.layout, hours) : input.insightLevels;
  const sum = (levels: number[]) => levels.slice(0, found).reduce((total, level) => total + level, 0);
  return {
    hours: realHours,
    slots: best.layout,
    ratioToday: today(best.layout) / (today(slots) || 1),
    ratioAtHorizon: best.value / (score(slots) || 1),
    insightLevelsGained: sum(levelsBest) - sum(levelsNow),
    drags: getLensDrags(slots, best.layout, input.lensCap)
  };
};
