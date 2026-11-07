// Who walks through the What's new story and how they get there, as plain numbers. Sizes and heights are in the stage's unit
// (--u in story.module.css), and x is a share of its width, so a window of any shape keeps the rows together at the bottom.

// Must match --u in story.module.css: 1% of the width, or the height's share for the shape the layout was drawn at.
const WIDE_SHARE = 1.78;
const PHONE_SHARE = 0.533;
export const stageUnit = (width, height, phone) => Math.min(width, height * (phone ? PHONE_SHARE : WIDE_SHARE)) / 100;

// At pace 1 a character covers its own width each second, which is what its feet do at the game's 500ms step. Ground speed and
// step speed always change together, so the feet never slide.
export const CROWD_PACE = 2;
export const WALK_GAP_MS = 190;
export const WALKER_CROSSING_MS = 4200;
export const walkerPace = (width, size) => ((width + size) / size) / (WALKER_CROSSING_MS / 1000);

const stepFor = (count, widest, room) => (count > 1 ? Math.min(widest, room / (count - 1)) : 0);
const startFor = (count, step, w) => (100 - (step * (count - 1) + w)) / 2;

const phoneRows = (count, spot) => Array.from({ length: count }, (_, index) => {
  const row = Math.floor(index / 3);
  const rows = Math.ceil(count / 3);
  return { index, side: row % 2 ? 'right' : 'left', x: spot.x + (index % 3) * 32, bottom: spot.bottom + (rows - 1 - row) * spot.rowHeight, w: spot.w };
});

// Two rows on the first slide: the back row comes in from the right, the front row from the left.
export const helloSpots = (count, phone) => {
  if (phone) return phoneRows(count, { x: 0, bottom: 2, rowHeight: 30, w: 36 });
  const w = 17;
  const step = stepFor(count, 14, 98 - w);
  const start = startFor(count, step, w);
  return Array.from({ length: count }, (_, index) => ({
    index, side: index % 2 ? 'right' : 'left', x: start + index * step, bottom: index % 2 ? 16.1 : 2.6, w
  }));
};

// One row on the last slide: half from each side, meeting in the middle.
export const lastSpots = (count, phone) => {
  if (phone) return phoneRows(count, { x: 3, bottom: 1, rowHeight: 25, w: 30 });
  const w = 12;
  const step = stepFor(count, 12, 99 - w);
  const start = startFor(count, step, w);
  return Array.from({ length: count }, (_, index) => ({
    index, side: index < Math.ceil(count / 2) ? 'left' : 'right', x: start + index * step, bottom: 1.2, w
  }));
};

// Each side walks at one pace, the one going furthest first, so nobody crosses anybody. The sheets face right, so whoever
// comes from the right faces left, and goes on facing that way once they stop.
export const walkIn = (spots, width, unit) => {
  const fromLeft = spots.filter(({ side }) => side === 'left').sort((a, b) => b.x - a.x);
  const fromRight = spots.filter(({ side }) => side === 'right').sort((a, b) => a.x - b.x);
  return [fromLeft, fromRight].flatMap((group) => group.map((spot, rank) => {
    const size = spot.w * unit;
    const at = (spot.x / 100) * width;
    const distance = spot.side === 'left' ? at + size : width - at;
    return {
      ...spot,
      mirrored: spot.side === 'right',
      delay: rank * WALK_GAP_MS,
      duration: (distance / (size * CROWD_PACE)) * 1000,
      from: spot.side === 'left' ? -distance : distance
    };
  })).sort((a, b) => a.index - b.index);
};

const SAMPLE_CREW = [
  { name: 'Warrior', hat: 'EquipmentHats58', weapon: 'TestObj7', cape: 'EquipmentCape1' },
  { name: 'Archer', hat: 'EquipmentHats41', weapon: 'EquipmentBows4', cape: 'EquipmentCape12' },
  { name: 'Mage', hat: 'EquipmentHats26', weapon: 'EquipmentWands5', cape: 'EquipmentCape21', costume: 'EquipmentGown1' },
  { name: 'Beginner', hat: 'EquipmentHats1', weapon: 'TestObj1' },
  { name: 'Journeyman', hat: 'EquipmentHats16', weapon: 'EquipmentPunching1', cape: 'EquipmentCape23' }
];

// For a visitor with no save: a crew with no name of its own, so the story never pretends to know them.
export const sampleCrew = (items) => SAMPLE_CREW.map(({ name, ...slots }) => ({
  pose: '0',
  name,
  companion: null,
  ...Object.fromEntries(Object.entries(slots).map(([slot, rawName]) => [slot, items[rawName] ?? null]))
}));
