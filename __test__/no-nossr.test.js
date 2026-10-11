import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { repoRelative, sourceFiles } from './helpers/source-files';

// useMediaQuery's noSsr option renders the real match on the first client render while the build
// rendered `false`: a hydration mismatch on every viewport where the query is true, and one
// mismatch makes React throw the server DOM away and re-render the whole page. Without the option
// MUI returns `false` on both sides and the real value a render later.
const ROOTS = ['components', 'pages', 'hooks'];

describe('no noSsr media queries', () => {
  it('finds none under components/, pages/ and hooks/', () => {
    const hits = sourceFiles(ROOTS)
      .filter((file) => readFileSync(file, 'utf8').includes('noSsr'))
      .map(repoRelative);
    expect(hits).toEqual([]);
  });
});
