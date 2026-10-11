import fs from 'node:fs';
import path from 'node:path';

export const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SCRIPT = /\.(jsx?|tsx?)$/;

const walk = (dir, pattern, out) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, pattern, out);
    else if (pattern.test(entry)) out.push(full);
  }
  return out;
};

// Absolute paths of every file under the given repo-root directories whose name matches pattern.
export const sourceFiles = (dirs, pattern = SCRIPT) =>
  dirs.flatMap((dir) => walk(path.join(REPO_ROOT, dir), pattern, []));

export const repoRelative = (file) => path.relative(REPO_ROOT, file).replace(/\\/g, '/');
