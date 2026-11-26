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
