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
// HTTP 403 / error code 1010. It does not currently — a bare fetch returns 200 — but the check
// is a dashboard toggle that can come back on without a code change, and a build that starts
// failing on it is an outage. Kept deliberately.
export const BUILD_FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const PAGE_SIZE = 100;
const MAX_PAGES = 60; // runaway guard: 6000 builds

const isValidBuild = (item) =>
  Boolean(item && typeof item.shortId === 'string' && typeof item.class === 'string');

// getStaticProps runs once per generated page, so [slug].jsx alone would
// refetch everything 143 times. Memoise the in-flight promise: one fetch per
// build process, shared by every caller. Not exported — callers should not
// need to know this exists.
let cachedBuildsPromise = null;

export function resetBuildsCacheForTests() {
  cachedBuildsPromise = null;
  cachedDetails.clear();
  detailSeen = 0;
  detailFailures = 0;
}

export function fetchAllBuildsAtBuildTime() {
  if (!cachedBuildsPromise) {
    cachedBuildsPromise = doFetchAllBuilds().catch((error) => {
      // Don't cache a rejection — a retry should be able to succeed.
      cachedBuildsPromise = null;
      throw error;
    });
  }
  return cachedBuildsPromise;
}

// The list endpoint omits `payload` - the talent data that IS the build - so without this a build
// page's substance exists only after a client-side fetch to the Worker. That dependency is what
// made these pages invisible to search in the first place.
//
// Counters are deliberately excluded: likeCount and viewCount tick constantly, and a baked value
// would render a visibly wrong number on every load. They stay on the runtime fetch.
const STATIC_BUILD_KEYS = [
  'shortId', 'title', 'description', 'class', 'subclass', 'tags',
  'payload', 'ownerName', 'isAnonymous', 'createdAt', 'updatedAt'
];

// Next forks a worker per CPU for static generation and each runs its own pool, so the Worker sees
// this multiplied. 8 per process lost ~8% of payloads to what looked like rate limiting; 4 with
// retries loses none.
const DETAIL_CONCURRENCY = 4;
const DETAIL_ATTEMPTS = 3;
// undici's default header timeout is 300s. A Worker that accepts the connection and then stalls
// would otherwise hang the build for hours, silently, once per attempt.
const DETAIL_TIMEOUT_MS = 10_000;
// One bad build must not fail a deploy, but half of them silently reverting to fetch-on-mount is
// the SEO regression this whole change exists to prevent. Loud beats degraded past this point.
const DETAIL_MAX_FAILURE_RATIO = 0.2;

export const toStaticBuild = (detail) => {
  if (!detail) return null;
  const out = {};
  for (const key of STATIC_BUILD_KEYS) {
    if (detail[key] !== undefined) out[key] = detail[key];
  }
  return out;
};

// Memoised per id, not per call: Next forks a worker per CPU and each re-imports this module, so a
// batch keyed on the whole list made every worker fetch all 121 details - including workers that
// only rendered class pages, which need none. Keying by id means a page fetches exactly what it
// asks for, once per process.
const cachedDetails = new Map();

// Unlike the list fetch, a single failure here does NOT throw. A build whose detail is unavailable
// falls back to the previous behaviour - fetch on mount - which is a degraded page, not a broken
// one, and failing the whole deploy over one build trades a working site for a missing one. A
// systemic failure is different: see assertDetailFailureRatio.
export async function fetchBuildDetailAtBuildTime(shortId) {
  if (!shortId) return null;
  if (!cachedDetails.has(shortId)) {
    cachedDetails.set(shortId, fetchDetailWithRetries(shortId));
  }
  const detail = await cachedDetails.get(shortId);
  recordDetailOutcome(Boolean(detail), shortId);
  return detail;
}

// A running floor, because there is no batch to measure: each page fetches its own build, and Next
// forks a worker per CPU, so each process tallies what it saw. One bad build stays a warning; a
// systemic failure - the Worker rate-limiting the build, say - fails the deploy rather than
// shipping half the build pages silently reverted to fetching on mount.
let detailSeen = 0;
let detailFailures = 0;
const DETAIL_FLOOR_MIN_SAMPLE = 10;

function recordDetailOutcome(ok, shortId) {
  detailSeen += 1;
  if (ok) return;
  detailFailures += 1;
  console.warn(`builds: no detail payload for ${shortId} — that page falls back to fetching on mount`);

  if (detailSeen < DETAIL_FLOOR_MIN_SAMPLE) return;
  const ratio = detailFailures / detailSeen;
  if (ratio > DETAIL_MAX_FAILURE_RATIO) {
    throw new Error(
      `Builds API: ${detailFailures}/${detailSeen} detail payloads unavailable (>${DETAIL_MAX_FAILURE_RATIO * 100}%) — refusing to deploy build pages that would silently fall back to fetching on mount`
    );
  }
}

async function fetchOneDetail(shortId) {
  const base = process.env.NEXT_PUBLIC_BUILDS_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_BUILDS_URL is not set — cannot fetch build details at build time');
  }
  const response = await fetch(`${base}/builds/${encodeURIComponent(shortId)}`, {
    headers: { 'Content-Type': 'application/json', 'User-Agent': BUILD_FETCH_USER_AGENT },
    signal: AbortSignal.timeout(DETAIL_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const build = data?.build || data;
  if (build?.payload === undefined) throw new Error('detail carried no payload');
  return toStaticBuild(build);
}

// Resolves to null rather than rejecting - the caller decides whether one missing payload matters.
async function fetchDetailWithRetries(shortId) {
  for (let attempt = 1; attempt <= DETAIL_ATTEMPTS; attempt++) {
    try {
      return await fetchOneDetail(shortId);
    } catch {
      if (attempt < DETAIL_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
  }
  return null;
}

async function doFetchAllBuilds() {
  const base = process.env.NEXT_PUBLIC_BUILDS_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_BUILDS_URL is not set — cannot fetch builds at build time');
  }

  const all = [];
  let cursor = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set('cursor', cursor);
    const url = `${base}/builds?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': BUILD_FETCH_USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error(`Builds API returned HTTP ${response.status} for ${url}`);
    }

    const data = await response.json();
    all.push(...(data?.items || []).filter(isValidBuild));

    cursor = data?.nextCursor || null;
    if (!cursor) break;
  }

  if (cursor) {
    throw new Error(`Builds API pagination exceeded ${MAX_PAGES} pages — refusing to return a truncated build list`);
  }

  if (all.length === 0) {
    throw new Error('Builds API returned no builds — refusing to build a site without build pages');
  }

  return all;
}
