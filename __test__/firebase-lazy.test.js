import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { repoRelative, sourceFiles } from './helpers/source-files';

// firebase/index.js initialises auth, database and firestore at module top: ~700 KB of JS. A
// static import anywhere in the every-page tree puts it back into the chunk shared by every
// exported page. Only firebase/lazy.js may import it; everyone else awaits loadFirebase().
const ROOTS = ['components', 'pages', 'hooks'];

const FIREBASE_IMPORT = /(?:from\s*|import\s*\()\s*['"][^'"]*firebase(?:\/index)?['"]/;

describe('firebase stays out of the every-page bundle', () => {
  it('is imported by firebase/lazy.js alone', () => {
    const hits = sourceFiles(ROOTS)
      .filter((file) => FIREBASE_IMPORT.test(readFileSync(file, 'utf8')))
      .map(repoRelative);
    expect(hits).toEqual([]);
  });
});
