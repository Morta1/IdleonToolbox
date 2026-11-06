// A kit setup for the pages that read the site's own APIs, which refuse localhost by CORS: /statistics, /leaderboards,
// /guilds, /tools/builds. Each GET goes out once through Playwright, lands in .page-check/api-cache and replays from
// there with the header, so two runs compare byte for byte. Delete the folder for fresh rows. live-replies goes on top.
//   node tools/page-check.mjs /statistics --setup e2e/live-proxy.mjs
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import serveLiveReplies from './live-replies.mjs';

const CACHE = join('.page-check', 'api-cache');
const SITE_APIS = /(profiles|builds|guild-history)\.idleontoolbox\.workers\.dev/;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };

export default async function serveLiveApis(context) {
  mkdirSync(CACHE, { recursive: true });
  await context.route(SITE_APIS, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (request.method() !== 'GET') return route.abort();
    const file = join(CACHE, `${createHash('sha1').update(request.url()).digest('hex')}.json`);
    if (!existsSync(file)) {
      const response = await route.fetch();
      writeFileSync(file, JSON.stringify({ url: request.url(), status: response.status(), body: await response.text() }));
    }
    const { status, body } = JSON.parse(readFileSync(file, 'utf8'));
    return route.fulfill({ status, contentType: 'application/json', headers: CORS, body });
  });
  await serveLiveReplies(context);
}
