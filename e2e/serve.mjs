// Serves out/ for playwright.config.js and playwright.screens.config.js (npm run serve:e2e) on E2E_PORT, 3002 by
// default, so two checkouts can run their e2e or screens side by side. A node wrapper rather than the npm script
// itself: npm runs scripts through cmd.exe on Windows, where $E2E_PORT is never expanded.
import { spawn } from 'node:child_process';

const port = process.env.E2E_PORT ?? '3002';
// sirv, not serve: serve ran out of file handles (EMFILE) after about 1,200 views of a long kit run. --dev reads each
// file when it is asked for, so nothing walks the 15,000 files of out/ first and a rebuild needs no restart.
const child = spawn('npx', ['sirv', 'out', '--port', port, '--host', '0.0.0.0', '--dev', '--quiet'], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 1));
