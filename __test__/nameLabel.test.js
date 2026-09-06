import { describe, expect, it } from 'vitest';
import { glyphFile, nameLabelOps } from '@utility/nameLabel';
import manifest from '../data/player-sprites-manifest.json';

// The label actor's own local space: the game centres it on x 49 with the player origin at
// (45, 50). nameLabelOps returns feet-relative world px, so adding the origin back puts the
// numbers straight into the coordinates the live game was measured in.
const ORIGIN_X = 45;
const ORIGIN_Y = 50;
const local = (ops) => ops.map(({ file, x, y }) => ({ file, x: x + ORIGIN_X, y: y + ORIGIN_Y }));
const xsOf = (ops, match) => local(ops).filter(({ file }) => file.includes(match)).map(({ x }) => x);
const yOf = (ops, match) => local(ops).find(({ file }) => file.includes(match))?.y;

// Font 75's advances for the characters these tests use, straight from the shipped table.
const nameFont = { m: 9, o: 7, r: 6, t: 7, a: 7, s: 6, A: 9, U: 9, z: 7, ' ': 3 };
const plainCap = { w: 7, h: 24 };
const defaultSizes = {
  'NametagLeft_default.png': plainCap,
  'NametagMiddle_default.png': plainCap,
  'NametagRight_default.png': plainCap,
  'Trophy6disp.png': { w: 113, h: 23 }
};

describe('nameLabelOps', () => {
  // Measured off a live 2.3.528 client: name "mortastr", default nametag skin, Trophy6 equipped.
  const ops = nameLabelOps({ name: 'mortastr', trophyId: 6, nameFont, sizes: defaultSizes });

  it('lays the nametag out as one 7px tile per 7px of name width', () => {
    // m9 o7 r6 t7 a7 s6 t7 r6 = 55 -> ceil(55 / 7) = 8 middle tiles, plus the two end caps.
    expect(xsOf(ops, 'NametagLeft')).toEqual([14]);
    expect(xsOf(ops, 'NametagMiddle')).toEqual([21, 28, 35, 42, 49, 56, 63, 70]);
    expect(xsOf(ops, 'NametagRight')).toEqual([77]);
    expect(yOf(ops, 'NametagLeft')).toBe(48);
    expect(yOf(ops, 'NametagMiddle')).toBe(48);
    expect(yOf(ops, 'NametagRight')).toBe(48);
  });

  it('places every letter at the running advance, centred on the name width', () => {
    expect(xsOf(ops, '_i.png')).toEqual([22, 31, 38, 44, 51, 58, 64, 71]);
    expect(local(ops).filter(({ file }) => file.includes('_i.png')).every(({ y }) => y === 55)).toBe(true);
    expect(local(ops).filter(({ file }) => file.includes('_i.png')).map(({ file }) => file))
      .toEqual(['1m_i.png', '1o_i.png', '1r_i.png', '1t_i.png', '1a_i.png', '1s_i.png', '1t_i.png', '1r_i.png']);
  });

  it('centres the trophy on its own width, under the letters', () => {
    // 113 wide, so round(49 - 56.5) = -7: JS rounds a half up, which is what the game does too.
    expect(local(ops).find(({ file }) => file.startsWith('Trophy'))).toEqual({ file: 'Trophy6disp.png', x: -7, y: 70 });
  });

  it('draws the nametag, then the letters, then the trophy', () => {
    const order = ops.map(({ file }) => file);
    expect(order.at(0)).toBe('NametagLeft_default.png');
    expect(order.slice(0, 10).every((file) => file.startsWith('Nametag'))).toBe(true);
    expect(order.at(-2)).toBe('1r_i.png');
    expect(order.at(-1)).toBe('Trophy6disp.png');
  });
});

describe('nameLabelOps skins', () => {
  it('names the pieces after the equipped nametag ID', () => {
    const ops = nameLabelOps({ name: 'Mo', nametagId: 1, nameFont, sizes: { 'NametagLeft_1.png': { w: 17, h: 24 }, 'NametagRight_1.png': { w: 17, h: 24 } } });
    expect(local(ops).map(({ file }) => file)).toContain('NametagMiddle_1.png');
    // A 17px cap starts 10px further left so its right edge still meets the first middle tile.
    expect(xsOf(ops, 'NametagLeft')).toEqual([xsOf(ops, 'NametagMiddle')[0] - 17]);
  });

  it('drops the Island Adventurer skin (ID 7) two pixels lower than every other one', () => {
    const sizes = { 'NametagLeft_7.png': { w: 30, h: 24 }, 'NametagRight_7.png': { w: 30, h: 24 } };
    expect(yOf(nameLabelOps({ name: 'Mo', nametagId: 7, nameFont, sizes }), 'NametagMiddle')).toBe(50);
    expect(yOf(nameLabelOps({ name: 'Mo', nametagId: 6, nameFont, sizes }), 'NametagMiddle')).toBe(48);
  });

  it('lifts a taller end cap by a fifth of its extra height', () => {
    const sizes = { 'NametagLeft_20.png': { w: 25, h: 34 }, 'NametagRight_20.png': { w: 25, h: 25 } };
    const ops = nameLabelOps({ name: 'Mo', nametagId: 20, nameFont, sizes });
    expect(yOf(ops, 'NametagLeft')).toBe(46);
    expect(yOf(ops, 'NametagRight')).toBe(48);
    expect(yOf(ops, 'NametagMiddle')).toBe(48);
  });

  it('lays an end cap out as a plain tile while its image is still loading, so it can be requested', () => {
    const ops = nameLabelOps({ name: 'Mo', nametagId: 20, nameFont, sizes: {} });
    expect(xsOf(ops, 'NametagLeft')).toEqual([xsOf(ops, 'NametagMiddle')[0] - 7]);
    expect(yOf(ops, 'NametagLeft')).toBe(48);
  });

  it('still emits the trophy before its size is known, centred as if it were zero wide', () => {
    const ops = nameLabelOps({ name: 'Mo', trophyId: 6, nameFont, sizes: {} });
    expect(local(ops).find(({ file }) => file.startsWith('Trophy'))).toEqual({ file: 'Trophy6disp.png', x: 49, y: 70 });
  });

  it('draws a replica trophy from the original trophy art', () => {
    const replica = nameLabelOps({ name: 'Mo', trophyId: 6, nameFont, sizes: defaultSizes });
    expect(local(replica).find(({ file }) => file.startsWith('Trophy')).file).toBe('Trophy6disp.png');
  });

  it('draws no trophy when none is equipped, and nothing at all without a name', () => {
    expect(nameLabelOps({ name: 'Mo', nameFont, sizes: {} }).some(({ file }) => file.startsWith('Trophy'))).toBe(false);
    expect(nameLabelOps({ name: '', trophyId: 6, nameFont, sizes: {} })).toEqual([]);
  });

  it('advances past a space without drawing anything for it', () => {
    const ops = nameLabelOps({ name: 'A A', nameFont, sizes: {} });
    const letters = local(ops).filter(({ file }) => file.endsWith('_i.png'));
    expect(letters.map(({ file }) => file)).toEqual(['A_i.png', 'A_i.png']);
    expect(letters[1].x - letters[0].x).toBe(12); // A 9 + space 3
  });
});

describe('glyphFile', () => {
  it('names uppercase and digits after themselves and prefixes lowercase with 1', () => {
    expect(glyphFile('A')).toBe('A_i.png');
    expect(glyphFile('7')).toBe('7_i.png');
    expect(glyphFile('z')).toBe('1z_i.png');
  });
  it('has no art for a space or any other character', () => {
    expect(glyphFile(' ')).toBe(null);
    expect(glyphFile('!')).toBe(null);
  });
});

describe('the shipped name font', () => {
  it('carries every alphanumeric plus the space, and sums mortastr to 55', () => {
    const font = manifest.nameFont;
    expect(Object.keys(font).length).toBe(63);
    expect(font[' ']).toBe(3);
    expect([...'mortastr'].reduce((sum, char) => sum + font[char], 0)).toBe(55);
  });
});
