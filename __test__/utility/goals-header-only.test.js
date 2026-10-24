import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const GOAL_FOLDERS = ['components/goals/', 'components/dashboard/goals/'];
// The only places outside the goal folders allowed to reach goal UI or state
const IMPORT_ALLOWLIST = [
  'components/common/NavBar/index.jsx',
  'pages/_app.jsx',
  'components/dashboard/Account.jsx',
  'pages/tools/material-tracker.jsx'
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return /\.(jsx?|tsx?)$/.test(entry.name) ? [full] : [];
});

const rel = (file) => path.relative(root, file).split(path.sep).join('/');

// Static imports, dynamic import() and require(), with aliases and relative paths resolved to repo paths
const importedPaths = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const specifiers = [...text.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)]
    .map(([, spec]) => spec);
  return specifiers.map((spec) => {
    if (spec.startsWith('@components/')) return `components/${spec.slice('@components/'.length)}`;
    if (spec.startsWith('.')) return rel(path.resolve(path.dirname(file), spec));
    return spec;
  });
};

const outsideGoalFolders = () => ['pages', 'components']
  .flatMap((dir) => walk(path.join(root, dir)))
  .filter((file) => !GOAL_FOLDERS.some((folder) => rel(file).startsWith(folder)));

describe('goals are header-only', () => {
  it('only the allowlisted files import from components/goals', () => {
    const offenders = outsideGoalFolders()
      .filter((file) => !IMPORT_ALLOWLIST.includes(rel(file)))
      .filter((file) => importedPaths(file).some((p) => p.startsWith('components/goals/') || p === 'components/goals'))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it('no page or component outside the goals folders renders goal markers', () => {
    const offenders = outsideGoalFolders()
      .filter((file) => /SetGoalButton|goalHostSx|goalCornerSx/.test(fs.readFileSync(file, 'utf8')))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  // The material alert reads item goals, so the migration must run even with the Goals section hidden
  it('the dashboard alerts run the material tracker migration', () => {
    expect(fs.readFileSync(path.join(root, 'components/dashboard/Account.jsx'), 'utf8')).toMatch(/useMaterialTrackerMigration\(\)/);
  });

  it('no goal copy uses the play arrow', () => {
    const offenders = ['components', 'pages', 'utility']
      .flatMap((dir) => walk(path.join(root, dir)))
      .filter((file) => fs.readFileSync(file, 'utf8').includes('▶'))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});
