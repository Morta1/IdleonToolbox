import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every image needs an alt ATTRIBUTE. The VALUE may be empty - that is a real answer, meaning
 * "decorative, skip me", and it is the correct one wherever the thing's name is already adjacent
 * text (summoning upgrades, spelunking chapters, the class icon beside a character's name). What is
 * never right is having no alt at all: a screen reader then falls back to announcing the file name,
 * so a grid of icons reads out as "Cave Shop Upg 4 dot p n g".
 *
 * This gate is deliberately about presence, not quality. It is a static scan of the source rather
 * than a render check, because a page only reachable with a save loaded would never be covered by a
 * logged-out sweep - and roughly a third of the images this found live on exactly those pages.
 */
const ROOT = path.resolve(__dirname, '..');
const SCANNED_DIRS = ['components', 'pages'];

// A src alone does not make an image - <script src=...> has one too, and alt on it is meaningless.
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

// Reads the full src={...} value, counting braces so a nested ${} in a template literal is kept.
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

describe('image alt attributes', () => {
  it('finds images to check at all', () => {
    // Without this the assertion below passes trivially if the tag regex or the directory list ever
    // stops matching - which is exactly how a gate goes quietly green while covering nothing.
    const { scanned } = findUnlabelled();
    expect(scanned).toBeGreaterThan(250);
  });

  it('every image carries an alt attribute, even if empty', () => {
    const { offenders } = findUnlabelled();
    expect(offenders, `Images with no alt attribute:\n${offenders.join('\n')}`).toEqual([]);
  });
});
