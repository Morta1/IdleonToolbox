import fs from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { REPO_ROOT } from './helpers/source-files';

const doc = fs.readFileSync(path.join(REPO_ROOT, 'docs/design-system.md'), 'utf8');

// Future sessions open what this file names, so a rename must not leave it pointing at nothing.
it('every path the design system names exists', () => {
  const paths = [...doc.matchAll(/`((?:components|pages|utility|styles|hooks|tools|e2e|__test__|docs)\/[^`\s*]+|eslint\.config\.mjs)`/g)].map((match) => match[1]);
  expect(paths.length).toBeGreaterThan(0);
  expect(paths.filter((file) => !fs.existsSync(path.join(REPO_ROOT, file)))).toEqual([]);
});
