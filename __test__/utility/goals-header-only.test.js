import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const ALLOWED = ['components/goals', 'components/dashboard/goals'];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return /\.(jsx?|tsx?)$/.test(entry.name) ? [full] : [];
});

const rel = (file) => path.relative(root, file).split(path.sep).join('/');

describe('goals are header-only', () => {
  it('no page or component outside the goals folders imports goal UI', () => {
    const offenders = ['pages', 'components']
      .flatMap((dir) => walk(path.join(root, dir)))
      .filter((file) => !ALLOWED.some((allowed) => rel(file).startsWith(`${allowed}/`)))
      .filter((file) => /components\/goals\/(SetGoalButton|goalHost)|goalHostSx|goalCornerSx|SetGoalButton/.test(fs.readFileSync(file, 'utf8')))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it('no goal copy uses the play arrow', () => {
    const offenders = ['components', 'pages', 'utility']
      .flatMap((dir) => walk(path.join(root, dir)))
      .filter((file) => fs.readFileSync(file, 'utf8').includes('▶'))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});
