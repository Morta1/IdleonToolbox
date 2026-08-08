// Build-time fetcher for community builds.
//
// Dependency-free ESM on purpose: utility/generate-sitemap.mjs is a plain Node
// script and cannot resolve Next path aliases or TypeScript sources.
//
// This module THROWS on failure by design. Subclass page paths are derived from
// this data, so a build that silently proceeds with fewer builds would deploy a
// site missing pages Google has already indexed. A failed build leaves the
// previous deploy serving; a degraded build 404s live URLs.

// Cloudflare's browser-integrity check rejects default fetch agents with
// HTTP 403 / error code 1010. A browser UA is required.
export const BUILD_FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const PAGE_SIZE = 100;
const MAX_PAGES = 60; // runaway guard: 6000 builds

const isValidBuild = (item) =>
  Boolean(item && typeof item.shortId === 'string' && typeof item.class === 'string');

// getStaticProps runs once per generated page, so [class].jsx alone would
// refetch everything 18 times. Memoise the in-flight promise: one fetch per
// build process, shared by every caller. Not exported — callers should not
// need to know this exists.
let cachedBuildsPromise = null;

export function resetBuildsCacheForTests() {
  cachedBuildsPromise = null;
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
