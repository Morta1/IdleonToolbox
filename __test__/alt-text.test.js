import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const SCANNED_DIRS = ['components', 'pages'];

const NOT_AN_IMAGE = /^<(script|link|source|iframe|video|audio|track|embed)\b/i;
const TAG = /<[A-Za-z][\w.]*\b[^<>]*?\/>/gs;

const collectFiles = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) collectFiles(full, out);
    else if (entry.endsWith('.jsx')) out.push(full);
  }
  return out;
};

const hasImageSrc = (tag) => {
  if (NOT_AN_IMAGE.test(tag)) return false;
  return tag.includes('src={');
};

const findUnlabelled = () => {
  const offenders = [];
  let scanned = 0;
  for (const dir of SCANNED_DIRS) {
    for (const file of collectFiles(path.join(ROOT, dir))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const [tag] of source.matchAll(TAG)) {
        if (!hasImageSrc(tag)) continue;
        scanned++;
        if (!/\balt=/.test(tag)) {
          offenders.push(`${path.relative(ROOT, file)}  ${tag.replace(/\s+/g, ' ').slice(0, 110)}`);
        }
      }
    }
  }
  return { offenders, scanned };
};

const INDEX_LIKE_ALT = /\balt=\{\s*[\w?.]*(?:[iI]ndex|Id|Face)\b[\w?.]*\s*\}/;

const findIndexLabelled = () => {
  const offenders = [];
  for (const dir of SCANNED_DIRS) {
    for (const file of collectFiles(path.join(ROOT, dir))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const [tag] of source.matchAll(TAG)) {
        if (!hasImageSrc(tag)) continue;
        if (INDEX_LIKE_ALT.test(tag)) {
          offenders.push(`${path.relative(ROOT, file)}  ${tag.replace(/\s+/g, ' ').slice(0, 110)}`);
        }
      }
    }
  }
  return offenders;
};

describe('image alt attributes', () => {
  it('finds images to check at all', () => {
    const { scanned } = findUnlabelled();
    expect(scanned).toBeGreaterThan(250);
  });

  it('every image carries an alt attribute, even if empty', () => {
    const { offenders } = findUnlabelled();
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
