#!/usr/bin/env node
// Bakes the 404's two scenes into public/etc, in one image each: a fixed picture, the same on the build and the client.
//   node tools/bake-404-art.mjs
// Twice the size the page draws them, so the sprites keep whole pixels on any screen without image-rendering: pixelated.
// A sign's lettering is the game's font 259 in the wood's dark brown; its sheet lives in z-processing (Z_PROCESSING).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const BAKE = 2;
const FONTS = join(process.env.Z_PROCESSING ?? '../z-processing', 'resources/graphics/1x');
const TILE = 20;
const CARVED = { dark: [40, 22, 8], light: [84, 48, 20] };
const CARVE_LIGHT = [255, 214, 165, 72];

const seeded = (start) => {
  let seed = start;
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
};

// A sprite at a whole multiple of its pixels; scale is in drawn px, so 1.5 still lands whole in the bake.
const scaled = async (file, scale) => {
  const { width, height } = await sharp(file).metadata();
  return sharp(file).resize(width * scale * BAKE, height * scale * BAKE, { kernel: 'nearest' }).png().toBuffer();
};

// The background's rows, then whole tiles gone with a chance that grows towards each torn edge.
const tornBackground = async (file, { width, height, top: rowsFrom, tear }) => {
  const { data, info } = await sharp(file).extract({ left: 0, top: rowsFrom, width, height }).ensureAlpha()
    .resize(width * BAKE, height * BAKE, { kernel: 'nearest' }).raw().toBuffer({ resolveWithObject: true });
  const random = seeded(tear.seed);
  const [cols, rows] = [Math.ceil(width / TILE), Math.ceil(height / TILE)];
  const side = TILE * BAKE;
  for (let row = 0; row < rows; row += 1) {
    const wobble = (random() - 0.5) * 0.05;
    for (let col = 0; col < cols; col += 1) {
      const [x, y] = [(col + 0.5) / cols, (row + 0.5) / rows];
      const start = tear.right[0] + wobble;
      const chance = Math.max(
        x > start ? ((x - start) / (tear.right[1] - start)) ** 0.8 : 0,
        x < tear.left ? (1 - x / tear.left) ** 0.9 : 0,
        y > 1 - tear.bottom ? ((y - (1 - tear.bottom)) / tear.bottom) ** 0.9 : 0,
        tear.top && y < tear.top ? (1 - y / tear.top) ** 0.9 : 0
      );
      if (random() >= chance) continue;
      for (let py = row * side; py < Math.min((row + 1) * side, info.height); py += 1) {
        for (let px = col * side; px < Math.min((col + 1) * side, info.width); px += 1) {
          data[(py * info.width + px) * 4 + 3] = 0;
        }
      }
    }
  }
  return { data, info };
};

const fontGlyphs = (id) => {
  const glyphs = {};
  for (const [, attributes] of readFileSync(join(FONTS, `font-${id}.fnt`), 'utf8').matchAll(/<char ([^>]*)\/?>/g)) {
    const glyph = Object.fromEntries([...attributes.matchAll(/(\w+)="(-?\d+)"/g)].map(([, key, value]) => [key, Number(value)]));
    glyphs[String.fromCharCode(glyph.id)] = glyph;
  }
  return glyphs;
};

// A word in a game font, its shading mapped onto the wood's browns, with a pale line under it so it reads as cut in. One
// font pixel more between letters than the font keeps: its digits touch, and touching they read as one block.
const carvedWord = async (word, fontId, scale, x, y, width) => {
  const glyphs = fontGlyphs(fontId);
  const sheet = join(FONTS, `font-${fontId}.png`);
  const pixels = scale * BAKE;
  const letters = [...word].map((char) => glyphs[char]);
  const wordWidth = letters.reduce((sum, { xadvance }) => sum + (xadvance + 1) * pixels, -pixels);
  let left = Math.round((x + (width - wordWidth / BAKE) / 2) * BAKE);
  const layers = [];
  for (const glyph of letters) {
    const { data, info } = await sharp(sheet).extract({ left: glyph.x, top: glyph.y, width: glyph.width, height: glyph.height })
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const shadow = Buffer.from(data);
    for (let i = 0; i < data.length; i += 4) {
      const shade = (data[i] + data[i + 1] + data[i + 2]) / 765;
      [0, 1, 2].forEach((channel) => {
        data[i + channel] = CARVED.dark[channel] + (CARVED.light[channel] - CARVED.dark[channel]) * shade;
        shadow[i + channel] = CARVE_LIGHT[channel];
      });
      shadow[i + 3] = data[i + 3] ? CARVE_LIGHT[3] : 0;
    }
    const enlarge = (raw) => sharp(raw, { raw: info }).resize(glyph.width * pixels, glyph.height * pixels, { kernel: 'nearest' }).png().toBuffer();
    const top = y * BAKE + glyph.yoffset * pixels;
    layers.push({ input: await enlarge(shadow), left, top: top + pixels });
    layers.push({ input: await enlarge(data), left, top });
    left += (glyph.xadvance + 1) * pixels;
  }
  return layers;
};

// The sprite's shape in see-through black: someone who isn't there.
const shadowOf = async (file, scale, strength) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 0;
    data[i + 3] *= strength;
  }
  return sharp(data, { raw: info }).resize(info.width * scale * BAKE, info.height * scale * BAKE, { kernel: 'nearest' }).png().toBuffer();
};

// A white speech bubble in whole 2 px steps, with its tail in the middle, and the game's question mark in it.
const bubble = async (x, y) => {
  const [width, height, step] = [32, 28, 2 * BAKE];
  const [w, h] = [width * BAKE, height * BAKE];
  const rect = (rx, ry, rw, rh) => `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#fff"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + step * 3}" shape-rendering="crispEdges">
    ${rect(step, 0, w - step * 2, h)}${rect(0, step, w, h - step * 2)}
    ${rect(w / 2 - step * 2, h, step * 4, step)}${rect(w / 2 - step, h + step, step * 2, step)}</svg>`;
  const mark = await sharp('public/data/QmarkB.png').metadata();
  return [
    { input: Buffer.from(svg), left: x * BAKE, top: y * BAKE },
    { input: 'public/data/QmarkB.png', left: x * BAKE + Math.round((w - mark.width) / 2), top: y * BAKE + Math.round((h - mark.height) / 2) }
  ];
};

const bake = async (out, background, layers) => {
  const { data, info } = await tornBackground(background.file, background);
  const image = await sharp(data, { raw: info }).composite(layers).png().toBuffer();
  // No more colors than a palette holds: the bake stays exact, and a tenth of the size.
  await sharp(image).png({ palette: true, colors: 256, dither: 0, effort: 10, compressionLevel: 9 }).toFile(out);
  console.log(`${out}: ${info.width}x${info.height}`);
};

const FIGURE = 'public/etc/Character.png';
await bake('public/etc/LostOffTheMap.png', {
  file: 'public/etc/bg_0.png', width: 1200, height: 460, top: 192,
  tear: { right: [0.82, 1.02], left: 0.05, bottom: 0.12, seed: 13 }
}, [
  { input: await scaled('public/data/CaveSign4.png', 2), left: 762 * BAKE, top: 0 },
  ...await carvedWord('404', 259, 3, 762, 84, 246),
  { input: await scaled('public/npcs/Pet_Dog/static.png', 1.5), left: 878 * BAKE, top: 328 * BAKE },
  { input: await scaled(FIGURE, 2), left: 949 * BAKE, top: 301 * BAKE },
  ...await bubble(949, 262)
]);
await bake('public/etc/LostProfile.png', {
  file: 'public/etc/bg_2.png', width: 1200, height: 360, top: 180,
  tear: { right: [0.93, 1.03], left: 0.06, bottom: 0.1, top: 0.14, seed: 29 }
}, [
  { input: await scaled('public/npcs/Telescope/static.png', 2), left: 495 * BAKE, top: 229 * BAKE },
  { input: await shadowOf(FIGURE, 2.5, 0.42), left: 914 * BAKE, top: 245 * BAKE }
]);
