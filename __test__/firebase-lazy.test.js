import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// firebase/index.js initialises auth, database and firestore at module top: ~700 KB of JS. A
// static import anywhere in the every-page tree puts it back into the chunk shared by every
// exported page. Only firebase/lazy.js may import it; everyone else awaits loadFirebase().
const ROOTS = ['components', 'pages', 'hooks'];

// Page-scoped and mounted under DataLoadingWrapper, so its import lands in that page's own chunk
// and never in the shared one.
const ALLOWED = new Set(['components/account/Worlds/World7/Tournament/Leaderboard.jsx']);

const FIREBASE_IMPORT = /(?:from\s*|import\s*\()\s*['"][^'"]*firebase(?:\/index)?['"]/;

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('firebase stays out of the every-page bundle', () => {
  it('is imported by firebase/lazy.js alone', () => {
    const hits = ROOTS.flatMap((root) => walk(path.join(process.cwd(), root)))
      .filter((file) => FIREBASE_IMPORT.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(process.cwd(), file).replace(/\\/g, '/'))
      .filter((file) => !ALLOWED.has(file));
    expect(hits).toEqual([]);
  });

  it('firebase/lazy.js memoises a single dynamic import', () => {
    const source = readFileSync(path.join(process.cwd(), 'firebase/lazy.js'), 'utf8');
    expect(source).toMatch(/import\('\.\/index'\)/);
  });
});
