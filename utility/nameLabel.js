// The in-game name label is a separate, UNSCALED actor that follows the player: the body is grown
// to scale 2 around its own origin while the nametag, the name letters and the trophy stay at 1x
// world pixels. Everything here is therefore world px measured from the body's feet origin, which
// is what PaperDollCanvas halves back into sprite px before drawing.
//
// The game lays the label out in its own local space, where the player origin sits at (45, 50) and
// the label is centred on x 49. Subtracting that origin at the end is the only step that ties the
// two spaces together. No DOM, no React: this is pure geometry, driven by the manifest's nameFont
// advance table (utility/paperDoll.js does the same job for the body layers).
const ORIGIN_X = 45;
const ORIGIN_Y = 50;
const CENTER_X = 49;
const TILE_W = 7;
const TILE_H = 24;
const BASE_Y = 53;
// The Island Adventurer nametag (ID 7) is the one skin the game drops two pixels lower.
const TALL_BASE_NAMETAG_ID = 7;
const TALL_BASE_Y = 55;
const TAG_DY = -5;
const LETTER_DY = 2;
const TROPHY_Y = 70;
// A left/right end cap taller than the plain 24px one is lifted by a fifth of the extra height,
// not by all of it: the game's own divisor, kept as-is.
const PIECE_LIFT_DIVISOR = 5;

// Letter art is named by the glyph: uppercase and digits as themselves, lowercase prefixed with
// "1" (the game's own MiscText mapping, so `a` is `1a_i.png`). A space advances the pen but draws
// nothing, and any other character is neither drawn nor advanced.
export const glyphFile = (char) => {
  if (/^[A-Z0-9]$/.test(char)) return `${char}_i.png`;
  if (/^[a-z]$/.test(char)) return `1${char}_i.png`;
  return null;
};

const nametagSuffix = (nametagId) => (Number.isFinite(nametagId) ? `_${nametagId}` : '_default');

export const nameLabelOps = ({ name, nametagId, trophyId, nameFont, sizes } = {}) => {
  const text = String(name ?? '');
  if (!text) return [];

  const font = nameFont ?? {};
  const advances = [...text].map((char) => font[char] ?? 0);
  const width = advances.reduce((sum, advance) => sum + advance, 0);
  const tiles = Math.ceil(width / TILE_W);

  const suffix = nametagSuffix(nametagId);
  const baseY = nametagId === TALL_BASE_NAMETAG_ID ? TALL_BASE_Y : BASE_Y;
  const tagY = baseY + TAG_DY;
  // An end cap whose image has not loaded yet is laid out as if it were the plain 7x24 tile, so
  // the op is still emitted and the canvas can request it; the next frame re-lays it out for real.
  const capSize = (file) => sizes?.[file] ?? { w: TILE_W, h: TILE_H };
  const ops = [];

  const leftFile = `NametagLeft${suffix}.png`;
  const left = capSize(leftFile);
  ops.push({
    file: leftFile,
    x: Math.round(CENTER_X - (left.w - TILE_W) - TILE_W * (tiles + 2) / 2) - ORIGIN_X,
    y: Math.round(tagY - (left.h - TILE_H) / PIECE_LIFT_DIVISOR) - ORIGIN_Y
  });

  const middleFile = `NametagMiddle${suffix}.png`;
  for (let i = 0; i < tiles; i++) {
    ops.push({
      file: middleFile,
      x: Math.round(CENTER_X - TILE_W * tiles / 2 + TILE_W * i) - ORIGIN_X,
      y: tagY - ORIGIN_Y
    });
  }

  const rightFile = `NametagRight${suffix}.png`;
  const right = capSize(rightFile);
  ops.push({
    file: rightFile,
    x: Math.round(CENTER_X - TILE_W * tiles / 2 + TILE_W * tiles) - ORIGIN_X,
    y: Math.round(tagY - (right.h - TILE_H) / PIECE_LIFT_DIVISOR) - ORIGIN_Y
  });

  let pen = 0;
  for (let i = 0; i < text.length; i++) {
    const file = glyphFile(text[i]);
    if (file) {
      ops.push({
        file,
        x: Math.round(CENTER_X - width / 2 + pen) - ORIGIN_X,
        y: baseY + LETTER_DY - ORIGIN_Y
      });
    }
    pen += advances[i];
  }

  if (Number.isFinite(trophyId)) {
    // Replica trophies reuse the real trophy's art, so the ID alone names the image.
    const file = `Trophy${trophyId}disp.png`;
    ops.push({
      file,
      x: Math.round(CENTER_X - (sizes?.[file]?.w ?? 0) / 2) - ORIGIN_X,
      y: TROPHY_Y - ORIGIN_Y
    });
  }

  return ops;
};
