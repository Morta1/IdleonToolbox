// Serves out/ for playwright.config.js and playwright.screens.config.js (npm run serve:e2e) on E2E_PORT, 3002 by
// default, so two checkouts can run their e2e or screens side by side. A node wrapper rather than the npm script
// itself: npm runs scripts through cmd.exe on Windows, where $E2E_PORT is never expanded.
import { spawn } from 'node:child_process';

const port = process.env.E2E_PORT ?? '3002';
const child = spawn('npx', ['serve@latest', 'out', '-l', port, '--no-clipboard'], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 1));
