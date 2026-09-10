import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// useMediaQuery's noSsr option renders the real match on the first client render while the build
// rendered `false`: a hydration mismatch on every viewport where the query is true, and one
// mismatch makes React throw the server DOM away and re-render the whole page. Without the option
// MUI returns `false` on both sides and the real value a render later.
const ROOTS = ['components', 'pages', 'hooks'];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('no noSsr media queries', () => {
  it('finds none under components/, pages/ and hooks/', () => {
    const hits = ROOTS.flatMap((root) => walk(path.join(process.cwd(), root)))
      .filter((file) => readFileSync(file, 'utf8').includes('noSsr'))
      .map((file) => path.relative(process.cwd(), file).replace(/\\/g, '/'));
    expect(hits).toEqual([]);
  });
});
