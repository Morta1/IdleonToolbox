import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devPort, e2ePort, slot } from './ports.mjs';

// SessionStart hook. Tells a session which worktree and port slot it is in, so parallel
// sessions do not have to be told by hand and cannot wander into each other's checkout.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || 'unknown';
const isMain = slot === 0;

const lines = [
  `Worktree: ${root}`,
  `Branch: ${branch}`,
  `Port slot ${slot} - dev server ${devPort}, e2e ${e2ePort}. Both are already wired up; run npm run dev and npm run test:e2e normally${isMain ? '' : `, and use ${devPort} rather than the 3001 that CLAUDE.md mentions`}.`,
];

if (!isMain) {
  lines.push(
    'This is a parallel worktree. Stay inside it: never edit, build, or run servers in the main checkout or a sibling worktree.',
    'Do not merge into main and do not rebase onto main unless asked - integration is handled from the main worktree.',
  );
}

process.stdout.write(`${JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lines.join('\n') },
})}\n`);
