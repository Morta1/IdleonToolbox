import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { portsForSlot } from './ports.mjs';

// SessionStart hook. The desktop app gives every new session its own worktree but nothing
// assigns it a port, so all of them would bind 3001 and quietly attach to each other's dev
// server. This claims a free slot on the worktree's first session and tells the session which
// worktree, branch and ports it owns.
//
// The slot is claimed here rather than in a WorktreeCreate hook because that hook does not fire
// for worktrees the desktop app or EnterWorktree create.

const git = (args, cwd) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

const normalize = (path) => resolve(path).replaceAll('\\', '/');
const root = git(['rev-parse', '--show-toplevel']);
const marker = join(root, '.worktree-slot');

const worktrees = git(['worktree', 'list', '--porcelain'])
  .split('\n')
  .filter((line) => line.startsWith('worktree '))
  .map((line) => normalize(line.slice('worktree '.length)));

const readSlot = (worktree) => {
  try {
    return Number(readFileSync(join(worktree, '.worktree-slot'), 'utf8').trim());
  } catch {
    return NaN;
  }
};

const claim = () => {
  const used = new Set([0]); // the main worktree is always slot 0
  for (const worktree of worktrees) {
    if (worktree === normalize(root)) continue;
    const taken = readSlot(worktree);
    if (Number.isInteger(taken)) used.add(taken);
  }
  let slot = 1;
  while (used.has(slot)) slot += 1;
  writeFileSync(marker, `${slot}\n`);
  return slot;
};

const isMain = !root || normalize(root) === worktrees[0];
let slot = 0;

if (!isMain) {
  slot = readSlot(root);
  if (!Number.isInteger(slot)) {
    slot = claim();
    // Two sessions opened at once can pick the same number; the later path defers and re-claims.
    const clash = worktrees.some((other) => other !== normalize(root) && readSlot(other) === slot && other < normalize(root));
    if (clash) slot = claim();
  }
}

const { devPort, e2ePort } = portsForSlot(slot);

// .worktreeinclude copies .env.local in verbatim, still pointing at the main worktree's port.
const env = join(root, '.env.local');
if (!isMain && existsSync(env)) {
  const rewritten = readFileSync(env, 'utf8').replace(/localhost:3001\b/g, `localhost:${devPort}`);
  if (rewritten !== readFileSync(env, 'utf8')) writeFileSync(env, rewritten);
}

const lines = [
  `Worktree: ${root || 'unknown'}`,
  `Branch: ${git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown'}`,
  `Port slot ${slot} - dev server ${devPort}, e2e ${e2ePort}. Both are already wired up; run npm run dev and npm run test:e2e normally${isMain ? '' : `, and use ${devPort} rather than the 3001 that CLAUDE.md mentions`}.`,
];

if (!isMain) {
  lines.push(
    'This is a parallel worktree. Stay inside it: never edit, build, or run servers in the main checkout or a sibling worktree.',
    'Commit on this branch as you go, but leave merging and rebasing onto main alone - integration happens from the main worktree.',
  );
}

process.stdout.write(`${JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lines.join('\n') },
})}\n`);
