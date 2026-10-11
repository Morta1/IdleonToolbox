import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { repoRelative, sourceFiles } from './helpers/source-files';

const SCANNED_DIRS = ['components', 'pages'];

const NOT_AN_IMAGE = /^<(script|link|source|iframe|video|audio|track|embed)\b/i;
const TAG = /<[A-Za-z][\w.]*\b[^<>]*?\/>/gs;

const hasImageSrc = (tag) => {
  if (NOT_AN_IMAGE.test(tag)) return false;
  return tag.includes('src={');
};

const findUnlabelled = () => {
  const offenders = [];
  let scanned = 0;
  for (const file of sourceFiles(SCANNED_DIRS, /\.jsx$/)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const [tag] of source.matchAll(TAG)) {
      if (!hasImageSrc(tag)) continue;
      scanned++;
      if (!/\balt=/.test(tag)) {
        offenders.push(`${repoRelative(file)}  ${tag.replace(/\s+/g, ' ').slice(0, 110)}`);
      }
    }
  }
  return { offenders, scanned };
};

const INDEX_LIKE_ALT = /\balt=\{\s*[\w?.]*(?:[iI]ndex|Id|Face)\b[\w?.]*\s*\}/;

const findIndexLabelled = () => {
  const offenders = [];
  for (const file of sourceFiles(SCANNED_DIRS, /\.jsx$/)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const [tag] of source.matchAll(TAG)) {
      if (!hasImageSrc(tag)) continue;
      if (INDEX_LIKE_ALT.test(tag)) {
        offenders.push(`${repoRelative(file)}  ${tag.replace(/\s+/g, ' ').slice(0, 110)}`);
      }
    }
  }
  return offenders;
};

describe('image alt attributes', () => {
  it('every image carries an alt attribute, even if empty', () => {
    const { offenders, scanned } = findUnlabelled();
    // Guards against a broken walk or tag regex passing vacuously.
    expect(scanned).toBeGreaterThan(250);
    expect(offenders, `Images with no alt attribute:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('the index-like matcher matches the shape it is meant to catch', () => {
    expect(INDEX_LIKE_ALT.test('<img src={`a${talentId}.png`} alt={talentId}/>')).toBe(true);
    expect(INDEX_LIKE_ALT.test('<img src={x} alt={upgrade.originalIndex}/>')).toBe(true);
    expect(INDEX_LIKE_ALT.test('<img src={x} alt={monster.MonsterFace}/>')).toBe(true);
    expect(INDEX_LIKE_ALT.test('<img src={x} alt={displayName}/>')).toBe(false);
    expect(INDEX_LIKE_ALT.test('<img src={x} alt=""/>')).toBe(false);
  });

  it('no image is labelled with a bare index or numeric id', () => {
    const offenders = findIndexLabelled();
    expect(offenders, `Images whose alt is an index or id:\n${offenders.join('\n')}`).toEqual([]);
  });
});
