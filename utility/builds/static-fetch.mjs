// Build-time fetcher for community builds.
//
// Dependency-free ESM on purpose: utility/generate-sitemap.mjs is a plain Node
// script and cannot resolve Next path aliases or TypeScript sources.
//
// This module THROWS on failure by design. Subclass page paths are derived from
// this data, so a build that silently proceeds with fewer builds would deploy a
// site missing pages Google has already indexed. A failed build leaves the
// previous deploy serving; a degraded build 404s live URLs.

// Cloudflare's browser-integrity check has rejected default fetch agents on this Worker with
// HTTP 403 / error code 1010. It does not currently (a bare fetch returns 200), but the check
// is a dashboard toggle that can come back on without a code change, and a build that starts
// failing on it is an outage. Kept deliberately.
export const BUILD_FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

// One request for every public build, payloads included. It replaced walking the list (50 per
// page) and then fetching each build's detail: ~150 Worker runs per build process, each paying
// a MongoDB login, which made local builds and `next dev` the Worker's biggest CPU cost. The
// Worker caches this response, so repeats cost it nothing.
const BULK_PATH = '/builds-bulk';
// undici's default header timeout is 300s. A Worker that accepts the connection and then stalls
// would otherwise hang the build for minutes, silently.
const BULK_TIMEOUT_MS = 30_000;

const isValidBuild = (item) =>
  Boolean(item && typeof item.shortId === 'string' && typeof item.class === 'string');

// getStaticProps runs once per generated page, so [slug].jsx alone would refetch everything 143
// times. Memoise the in-flight promise: one fetch per build process, shared by every caller.
let cachedBulkPromise = null;

export function resetBuildsCacheForTests() {
  cachedBulkPromise = null;
}

function fetchBulk() {
  if (!cachedBulkPromise) {
    cachedBulkPromise = doFetchBulk().catch((error) => {
      // Don't cache a rejection: a retry should be able to succeed.
      cachedBulkPromise = null;
      throw error;
    });
  }
  return cachedBulkPromise;
}

// The list shape every caller used before: no payload or description. The landing page passes
// every build through its props, and payloads there would bloat each exported page.
const toListItem = ({ payload, description, updatedAt, ...item }) => item;

export async function fetchAllBuildsAtBuildTime() {
  const builds = await fetchBulk();
  return builds.map(toListItem);
}

// Counters are deliberately excluded: likeCount and viewCount tick constantly, and a baked value
// would render a visibly wrong number on every load. They stay on the runtime fetch.
const STATIC_BUILD_KEYS = [
  'shortId', 'title', 'description', 'class', 'subclass', 'tags',
  'payload', 'ownerName', 'isAnonymous', 'createdAt', 'updatedAt'
];

export const toStaticBuild = (detail) => {
  if (!detail) return null;
  const out = {};
  for (const key of STATIC_BUILD_KEYS) {
    if (detail[key] !== undefined) out[key] = detail[key];
  }
  return out;
};

// The payload - the talent data that IS the build - baked into its page, so the page's substance
// doesn't depend on a client-side fetch (what made these pages invisible to search). A build
// without one falls back to fetching on mount: a degraded page, not a broken one.
export async function fetchBuildDetailAtBuildTime(shortId) {
  if (!shortId) return null;
  const builds = await fetchBulk();
  const build = builds.find((entry) => entry.shortId === shortId);
  if (build?.payload === undefined) {
    console.warn(`builds: no detail payload for ${shortId}: that page falls back to fetching on mount`);
    return null;
  }
  return toStaticBuild(build);
}

// THROWS on any failure, by design (see the top of this file).
async function doFetchBulk() {
  const base = process.env.NEXT_PUBLIC_BUILDS_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_BUILDS_URL is not set: cannot fetch builds at build time');
  }
  const url = `${base}${BULK_PATH}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': BUILD_FETCH_USER_AGENT },
    signal: AbortSignal.timeout(BULK_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error(`Builds API returned HTTP ${response.status} for ${url}`);
  }

  const data = await response.json();
  const items = data?.items || [];
  if (typeof data?.total !== 'number' || items.length < data.total) {
    throw new Error(`Builds API returned ${items.length} of ${data?.total} builds: refusing to build from a truncated list`);
  }

  const all = items.filter(isValidBuild);
  if (all.length === 0) {
    throw new Error('Builds API returned no builds: refusing to build a site without build pages');
  }
  return all;
}
