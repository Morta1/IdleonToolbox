import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { portsForSlot } from './ports.mjs';

// Sets up an isolated worktree for a parallel session: its own branch, its own port
// slot, and its own copies of the untracked files `git worktree add` does not carry
// over (.env.local, .claude/launch.json).
//
// Deliberately no node_modules junction: 'git worktree remove' follows the reparse point
// and deletes through it, wiping the main worktree's node_modules. Each worktree gets its
// own install instead.

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const [name, requestedSlot] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const install = process.argv.includes('--install');
if (!name) {
  console.error('usage: node utility/new-worktree.mjs <branch-name> [slot] [--install]');
  process.exit(1);
}

const root = git('rev-parse', '--show-toplevel');
const worktreesDir = join(root, '.claude', 'worktrees');
const target = join(worktreesDir, name);

// An existing directory is adopted rather than rejected, so a worktree someone else made
// (EnterWorktree, plain `git worktree add`) can still be given a slot and its untracked files.
const adopt = existsSync(target);
if (adopt && !git('worktree', 'list', '--porcelain').includes(target.replaceAll('\\', '/'))) {
  console.error(`${target} exists but is not a registered worktree`);
  process.exit(1);
}

const usedSlots = () => {
  const used = new Set([0]); // slot 0 is the main worktree
  if (!existsSync(worktreesDir)) return used;
  for (const entry of readdirSync(worktreesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      used.add(Number(readFileSync(join(worktreesDir, entry.name, '.worktree-slot'), 'utf8').trim()));
    } catch {
      // a worktree without a marker predates this script; ignore it
    }
  }
  return used;
};

const existingSlot = () => {
  try {
    return Number(readFileSync(join(target, '.worktree-slot'), 'utf8').trim());
  } catch {
    return NaN;
  }
};

let slot = Number(requestedSlot);
if (!requestedSlot) {
  slot = existingSlot();
  if (!Number.isInteger(slot)) {
    const used = usedSlots();
    slot = 1;
    while (used.has(slot)) slot += 1;
  }
}

const { devPort, e2ePort } = portsForSlot(slot);

if (!adopt) {
  const branchExists = git('branch', '--list', name) !== '';
  mkdirSync(worktreesDir, { recursive: true });
  git('worktree', 'add', ...(branchExists ? [target, name] : [target, '-b', name, 'main']));
}

writeFileSync(join(target, '.worktree-slot'), `${slot}\n`);

const envSource = join(root, '.env.local');
const envTarget = join(target, '.env.local');
if (existsSync(envSource)) {
  copyFileSync(envSource, envTarget);
  writeFileSync(envTarget, readFileSync(envTarget, 'utf8').replace(/localhost:3001/g, `localhost:${devPort}`));
} else {
  console.warn('no .env.local to copy');
}

mkdirSync(join(target, '.claude'), { recursive: true });
writeFileSync(join(target, '.claude', 'launch.json'), `${JSON.stringify({
  version: '0.0.1',
  configurations: [{ name: `idleon-toolbox-${name}`, url: `http://localhost:${devPort}`, port: devPort }],
}, null, 2)}\n`);

// Without this the new session re-prompts for every permission already granted. The file lives
// either beside the repo or one level up, depending on where Claude Code was launched from.
const settingsSource = [join(root, '.claude', 'settings.local.json'), join(root, '..', '.claude', 'settings.local.json')]
  .find((candidate) => existsSync(candidate));
if (settingsSource) copyFileSync(settingsSource, join(target, '.claude', 'settings.local.json'));
else console.warn('no settings.local.json found - the new session will re-prompt for permissions');

if (install) {
  console.log('installing dependencies (this takes a few minutes)...');
  execFileSync('npm', ['install'], { cwd: target, stdio: 'inherit', shell: true });
}

console.log(`
worktree  ${target}
branch    ${name}
slot      ${slot}   dev ${devPort}   e2e ${e2ePort}
${install ? '' : '\nRun npm install in the worktree before it can start.\n'}
Paste this into the new session:
---
Work in ${target} on branch ${name}. Slot ${slot}: dev server is port ${devPort}, e2e is port ${e2ePort} (already configured, just run npm run dev / npm run test:e2e). Do not touch any other worktree, and do not merge into main.
---`);
