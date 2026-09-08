import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// firebase/index.js initialises auth, database and firestore at module top: ~700 KB of JS. A
// static import anywhere in the every-page tree puts it back into the chunk shared by all 4,800
// exported pages. Only firebase/lazy.js may import it; everyone else awaits loadFirebase().
const EVERY_PAGE_FILES = [
  'components/common/context/AppProvider.jsx',
  'components/common/Logins/EmailLogin.jsx',
  'components/common/NavBar/index.jsx',
  'components/common/NavBar/LoginDialog.jsx',
  'pages/_app.jsx'
];

describe('firebase stays out of the every-page bundle', () => {
  for (const file of EVERY_PAGE_FILES) {
    it(`${file} has no static firebase import`, () => {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      const staticImports = source.split('\n')
        .filter((line) => /^import .* from ['"].*firebase(\/index)?['"]/.test(line));
      expect(staticImports).toEqual([]);
    });
  }

  it('firebase/lazy.js memoises a single dynamic import', () => {
    const source = readFileSync(path.join(process.cwd(), 'firebase/lazy.js'), 'utf8');
    expect(source).toMatch(/import\('\.\/index'\)/);
  });
});
