// Where each number goes on a map's picture. Pure, so the build and the browser place them alike.
// A two-digit plate's width; a one-digit plate is narrower and takes the same room.
export const PIN_WIDTH = 24;
export const PIN_HEIGHT = 18;
const HALF_W = PIN_WIDTH / 2;
const HALF_H = PIN_HEIGHT / 2;
// A number this much closer to its own mark than to any other reads as its own.
const CLEAR = 6;

const overlap = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]))
  * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));

export const pinDistance = ([x, y], box) => Math.hypot(
  Math.max(box[0] - x, 0, x - box[0] - box[2]),
  Math.max(box[1] - y, 0, y - box[1] - box[3])
);

export const pinsTouch = (a, b) => Math.abs(a[0] - b[0]) < PIN_WIDTH && Math.abs(a[1] - b[1]) < PIN_HEIGHT;

// On an island each area has the game's button, and its number over it: under it where the space above holds another
// button or a number already placed.
const BUTTON = [23, 18];
export const PLATE_OFFSET = (BUTTON[1] + PIN_HEIGHT) / 2;
export const placePlates = (points) => {
  const plates = [];
  return points.map(([x, y], i) => {
    const cost = (spot) => points.filter((other, j) => j !== i
      && Math.abs(other[0] - x) < (BUTTON[0] + PIN_WIDTH) / 2 && Math.abs(other[1] - spot) < PLATE_OFFSET).length
      + 5 * plates.filter((plate) => pinsTouch(plate, [x, spot])).length;
    const below = cost(y - PLATE_OFFSET) > cost(y + PLATE_OFFSET);
    plates.push([x, y + (below ? 1 : -1) * PLATE_OFFSET]);
    return below;
  });
};

// Round the mark, close in and then further out, then the mark's own corners, edges and middle.
const candidates = ([x, y, w, h]) => [
  ...[1, 4, 10, 16].flatMap((gap) => [0.5, 0.2, 0.8, 0, 1].flatMap((share) => [
    [x + w * share, y - HALF_H - gap], [x + w * share, y + h + HALF_H + gap], [x - HALF_W - gap, y + h * share], [x + w + HALF_W + gap, y + h * share]
  ])),
  ...[0, 0.5, 1].flatMap((fx) => [0, 0.5, 1].map((fy) => [x + w * fx, y + h * fy, true]))
];

// Each pin's center, in the picture's drawn pixels, for `boxes` in native ones.
export const placePins = (boxes, width, height, scale) => {
  const [w, h] = [width * scale, height * scale];
  const drawn = boxes.map((box) => box.map((n) => n * scale));
  const placed = [];
  const place = (box, i) => {
    const others = drawn.filter((_, j) => j !== i);
    const cost = ([x, y, inside]) => {
      const spot = [x - HALF_W, y - HALF_H, PIN_WIDTH, PIN_HEIGHT];
      const own = pinDistance([x, y], box);
      const nearest = Math.min(Infinity, ...others.map((other) => pinDistance([x, y], other)));
      const room = nearest - own;
      return others.reduce((sum, other) => sum + overlap(spot, other), overlap(spot, box) / 2)
        + placed.reduce((sum, pin, j) => sum + (j !== i && pinsTouch(pin, [x, y]) ? 5000 : 0), 0)
        + (room <= 0 ? 3000 : room < CLEAR ? 150 * (1 - room / CLEAR) : 0)
        + own * 4 + (inside ? 20 : 0);
    };
    placed[i] = candidates(box)
      .map(([x, y, inside]) => [Math.min(Math.max(HALF_W, x), w - HALF_W), Math.min(Math.max(HALF_H, y), h - HALF_H), inside])
      .reduce((best, spot) => (cost(spot) < cost(best) ? spot : best));
  };
  // The first pass only knows the pins before each one; the later ones settle against them all.
  for (let pass = 0; pass < 3; pass++) drawn.forEach(place);
  return placed.map(([x, y]) => [x, y]);
};
