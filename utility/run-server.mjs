import { spawn } from 'node:child_process';
import { devPort, e2ePort, slot } from './ports.mjs';

// Ports are resolved from the worktree slot rather than baked into package.json,
// so `npm run dev` in a second worktree does not collide with the first one.
const isE2E = process.argv[2] === 'e2e';
const port = isE2E ? e2ePort : devPort;
const command = isE2E
  ? `npx serve@latest out -l ${port} --no-clipboard`
  : `next dev --port=${port}`;

console.log(`slot ${slot} -> ${isE2E ? 'e2e' : 'dev'} on http://localhost:${port}`);
spawn(command, { stdio: 'inherit', shell: true }).on('exit', (code) => process.exit(code ?? 0));
