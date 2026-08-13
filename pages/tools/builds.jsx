import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import BuildsBrowser, { INITIAL_FILTERS } from '@components/tools/builds/BuildsBrowser';
import { listBuilds } from 'services/builds';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import { buildCrawlLink, classCrawlLink, staticIdSet } from '@utility/builds/build-pages.mjs';
import { classToSlug } from '@utility/builds/class-paths.mjs';
import { CLASS_KEYS } from '@utility/builds/classes';
import { filterAndSortBuilds } from '@utility/builds/filter-builds';

const VALID_SORTS = new Set(['new', 'top']);

// URL <-> filters helpers. Class is deliberately absent: it lives in the path
// (/tools/builds/<class>), so there is one URL per class rather than a path and a ?class= that
// render the same thing.
const filtersFromQuery = (query) => {
  const sort = typeof query.sort === 'string' && VALID_SORTS.has(query.sort) ? query.sort : 'new';
  const q = typeof query.q === 'string' ? query.q : '';
  const tagsRaw = typeof query.tags === 'string' ? query.tags : '';
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
  return { sort, q, tags };
};

const filtersToQuery = (filters) => {
  const q = {};
  if (filters.sort && filters.sort !== 'new') q.sort = filters.sort;
  if (filters.q) q.q = filters.q;
  if (filters.tags?.length) q.tags = filters.tags.join(',');
  return q;
};

const queriesEqual = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
};

// How many of the newest builds the mount-time refresh asks for. Only builds published since the
// last deploy can be missing from static props, so this is a freshness window, not a page size.
const REFRESH_LIMIT = 24;

// Exported for tests: separates the data shape from Next's build pipeline.
//
// Every build, not a slice. The hub is the only page that links all of them, and a link that
// only exists after a cross-origin fetch resolves is a link Googlebot may never follow.
export function getBuildsLandingStaticProps(builds) {
  const all = [...(builds || [])].sort(
    (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
  return {
    props: {
      initialBuilds: all,
      // The hub is the index the rest of the section hangs off: every class page and every build
      // page is one hop from here for a crawler that never runs JS.
      crawlHeading: 'Idleon builds by class',
      crawlLinks: [
        ...CLASS_KEYS.map((key) => classCrawlLink(classToSlug(key), key.replace(/_/g, ' '))),
        ...all.map(buildCrawlLink)
      ]
    }
  };
}

export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildsLandingStaticProps(builds);
}

// -- Page --------------------------------------------------------------------

const Builds = ({ initialBuilds }) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;

  // Derived from initialBuilds, never from `items`: only the builds present at build time have
  // an exported page, and the mount refresh below merges in ones that don't.
  const staticIds = staticIdSet(initialBuilds);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [items, setItems] = useState(initialBuilds || []);
  // Hydration is tracked via React state (not a ref) so the mirror-to-URL effect doesn't race
  // with the setFilters commit during the first pass. With a ref, the mirror would see
  // `hydrated === true` on the same render where the hydration effect synchronously mutated it,
  // but `filters` would still be INITIAL_FILTERS — stripping the incoming URL's query params.
  const [hydrated, setHydrated] = useState(false);

  // Every build is already here, so searching, tagging and sorting run in memory. Nothing about
  // filtering touches the network.
  const visible = filterAndSortBuilds(items, filters);

  // Hydrate filters from the URL once the router reports its query as ready. After this,
  // `filters` state is the source of truth and we replace the URL on every change (see below).
  useEffect(() => {
    if (!router.isReady || hydrated) return;
    setFilters(filtersFromQuery(router.query || {}));
    setHydrated(true);
  }, [router.isReady, router.query, hydrated]);

  // Mirror filter state back into the URL (shallow — no re-mount). Runs only after hydration so
  // we don't clobber the initial URL read on the first render.
  useEffect(() => {
    if (!hydrated) return;
    const nextFilterQuery = filtersToQuery(filters);
    const filterKeys = ['sort', 'q', 'tags'];
    const currentFilterQuery = Object.fromEntries(
      Object.entries(router.query || {}).filter(([k]) => filterKeys.includes(k))
    );
    if (queriesEqual(currentFilterQuery, nextFilterQuery)) return;
    // Preserve any unrelated query params the app might set elsewhere and rebuild only the
    // filter slice of the URL.
    const preserved = Object.fromEntries(
      Object.entries(router.query || {}).filter(([k]) => !filterKeys.includes(k))
    );
    router.replace(
      { pathname: router.pathname, query: { ...preserved, ...nextFilterQuery } },
      undefined,
      { shallow: true, scroll: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sort, filters.q, filters.tags?.join(',')]);

  // Builds published since the last deploy aren't in static props and have no static page. One
  // request, no debounce — they arrive with a view?id= href from buildHref.
  useEffect(() => {
    let cancelled = false;
    listBuilds({ sort: 'new', limit: REFRESH_LIMIT })
      .then((res) => {
        if (cancelled) return;
        setItems((prev) => {
          const known = new Set(prev.map((b) => b.shortId));
          const fresh = (res?.items || []).filter((b) => !known.has(b.shortId));
          return fresh.length ? [...fresh, ...prev] : prev;
        });
      })
      // The static list is complete as of the last deploy, so a failed refresh costs at most the
      // newest few builds — not worth an error banner over a page that is already working.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNew = () => {
    if (!signedIn) return;
    router.push('/tools/builds/new');
  };

  return (
    <>
      <NextSeo
        title="Builds | Idleon Toolbox"
        description="Browse and share optimized talent builds for every class and subclass in Legends of Idleon"
        // ?sort=, ?q=, ?tags= and the legacy ?class= are all views of this one page. Without a
        // fixed canonical each combination is a separate URL competing with it.
        canonical="https://idleontoolbox.com/tools/builds"
      />
      <BuildsBrowser
        title="Idleon Builds"
        subtitle="Community talent builds for every class and subclass."
        signedIn={signedIn}
        filters={filters}
        onFiltersChange={setFilters}
        builds={visible}
        staticIds={staticIds}
        onNewBuild={handleNew}
      />
    </>
  );
};

export default Builds;
