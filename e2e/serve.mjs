// Serves out/ for playwright.config.js and playwright.screens.config.js (npm run serve:e2e) on E2E_PORT, 3002 by
// default, so two checkouts can run their e2e or screens side by side.
import { readFile } from 'node:fs';
import { createServer } from 'node:http';
import sirv from 'sirv';

const port = Number(process.env.E2E_PORT ?? 3002);
// sirv, not serve: serve ran out of file handles (EMFILE) after about 1,200 views of a long kit run. dev reads each
// file when it is asked for, so nothing walks the 15,000 files of out/ first and a rebuild needs no restart.
const files = sirv('out', { dev: true });

// As GitHub Pages does: a miss draws the site's 404 page, and the status stays 404 so the kit still fails on it.
const notFound = (res) => readFile('out/404.html', (error, page) => {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(error ? 'Not found' : page);
});

createServer((req, res) => files(req, res, () => notFound(res))).listen(port, '0.0.0.0');
