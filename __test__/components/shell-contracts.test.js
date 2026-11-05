import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (file) => readFileSync(new URL(`../../components/common/${file}`, import.meta.url), 'utf8');

// frame.js's breakpoints as the browser gets them: strings. A comma is an or, an and is an and.
const frameSource = source('NavBar/frame.js');
const constant = (name) => frameSource.match(new RegExp(`export const ${name} = ['\`](.+)['\`];`))[1];
const TALL_QUERY = constant('TALL');
const CENTERED_QUERY = constant('CENTERED').replace('$' + '{TALL}', TALL_QUERY);
const ONE_AD_QUERY = constant('ONE_AD');

const LIMITS = {
  'min-width': (size, px) => size.width >= px,
  'max-width': (size, px) => size.width <= px,
  'min-height': (size, px) => size.height >= px,
  'max-height': (size, px) => size.height <= px
};
const matches = (query, size) => query.replace('@media ', '').split(',').some((alternative) => {
  const limits = [...alternative.matchAll(/\((\w+-\w+): ([\d.]+)px\)/g)];
  return limits.length > 0 && limits.every(([, name, px]) => LIMITS[name](size, Number(px)));
});

describe('frame.js breakpoints', () => {
  it.each([
    [849.98, 950, 'none'],
    [850, 950, 'one'],
    [1899.98, 950, 'one'],
    [1900, 950, 'two'],
    [1920, 835.98, 'one'],
    [1920, 836, 'two'],
    [849.98, 835.98, 'none'],
    [850, 835.98, 'one']
  ])('%d x %d has %s', (width, height, ads) => {
    const size = { width, height };
    expect({ one: matches(ONE_AD_QUERY, size), two: matches(CENTERED_QUERY, size), tall: matches(TALL_QUERY, size) })
      .toEqual({ one: ads === 'one', two: ads === 'two', tall: height >= 836 });
  });
});

describe("PageSummary's phone list", () => {
  // It lays tiles out by marks StatTile sets: drop one from either file and a phone goes back to boxes and sprites, with
  // nothing else failing.
  it.each(['data-stat-tile', 'data-tile-icon'])('%s is in both files', (mark) => {
    expect(source('cards/StatTile.jsx')).toMatch(new RegExp(`<Box [^>]*${mark}[ />]`));
    expect(source('cards/PageSummary.jsx')).toContain(`'& [${mark}]'`);
  });
});
