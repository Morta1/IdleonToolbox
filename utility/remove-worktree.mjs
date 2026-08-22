import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

// `git worktree remove` cannot delete the node_modules junction that new-worktree.mjs
// creates, so drop the link first and let git handle the rest.

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

const [name, ...flags] = process.argv.slice(2);
if (!name) {
  console.error('usage: node utility/remove-worktree.mjs <branch-name> [--delete-branch]');
  process.exit(1);
}

const target = join(git('rev-parse', '--show-toplevel'), '.claude', 'worktrees', name);
const link = join(target, 'node_modules');

if (existsSync(link)) {
  const stat = lstatSync(link);
  if (stat.isSymbolicLink()) unlinkSync(link);
  else if (stat.isDirectory() && !stat.isSymbolicLink()) console.warn('node_modules is a real directory here, removing it with the worktree');
}

git('worktree', 'remove', '--force', target);
if (existsSync(target)) rmSync(target, { recursive: true, force: true });
git('worktree', 'prune');

if (flags.includes('--delete-branch')) git('branch', '-D', name);
console.log(`removed ${name}`);
