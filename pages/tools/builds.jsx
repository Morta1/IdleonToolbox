import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import BuildsBrowser, { INITIAL_FILTERS } from '@components/tools/builds/BuildsBrowser';
import { listBuilds } from 'services/builds';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import { getBuildClassSlugs } from '@utility/builds/class-paths.mjs';

const VALID_SORTS = new Set(['new', 'top']);

// URL <-> filters helpers. The URL serialises user-visible filters only (class / sort / tags /
// search). Cursor pagination stays in memory - a shareable link is always "the first page of
// this slice".
const filtersFromQuery = (query) => {
  const cls = typeof query.class === 'string' && query.class ? query.class : null;
  const sort = typeof query.sort === 'string' && VALID_SORTS.has(query.sort) ? query.sort : 'new';
  const q = typeof query.q === 'string' ? query.q : '';
  const tagsRaw = typeof query.tags === 'string' ? query.tags : '';
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
  return { class: cls, sort, q, tags };
};

const filtersToQuery = (filters) => {
  const q = {};
  if (filters.class) q.class = filters.class;
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

// The static seed is exactly one slice: unfiltered, sort 'new', first LANDING_SEED_LIMIT by
// createdAt desc. It may only be used as a fallback for a request asking for that same slice -
// otherwise we would present unfiltered builds as though they satisfied the user's filters.
export const matchesSeedSlice = (f) =>
  !f?.class && !f?.q && !f?.tags?.length && f?.sort === INITIAL_FILTERS.sort;

// Matches INITIAL_FILTERS.sort === 'new' and the runtime fetch's `limit` below. The build-time
// fetch pulls every build with no sort applied (Worker default is hotScore desc), so this
// re-sorts by createdAt desc and caps it at 24 - the exact slice the first runtime fetch will
// return. Without this, the seeded render would visibly reorder and shrink the instant the mount
// fetch lands.
const LANDING_SEED_LIMIT = 24;

// Exported for tests: separates the data shape from Next's build pipeline.
export function getBuildsLandingStaticProps(builds) {
  const seeded = [...(builds || [])]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, LANDING_SEED_LIMIT);
  return { props: { initialBuilds: seeded, classSlugs: getBuildClassSlugs(builds) } };
}

export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildsLandingStaticProps(builds);
}

// -- Page --------------------------------------------------------------------

const Builds = ({ initialBuilds, classSlugs }) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [items, setItems] = useState(initialBuilds || []);
  const [nextCursor, setNextCursor] = useState(null);
  // Already have server-rendered builds — don't show a skeleton over real content.
  const [loading, setLoading] = useState(!initialBuilds?.length);
  const [error, setError] = useState('');
  const fetchIdRef = useRef(0);
  // Hydration is tracked via React state (not a ref) so the mirror-to-URL
  // effect doesn't race with the setFilters commit during the first pass.
  // With a ref, the mirror would see `hydrated === true` on the same render
  // where the hydration effect synchronously mutated it, but `filters` would
  // still be INITIAL_FILTERS — stripping the incoming URL's query params.
  const [hydrated, setHydrated] = useState(false);

  const [tagsAnchor, setTagsAnchor] = useState(null);

  // Hydrate filters from the URL once the router reports its query as ready.
  // After this, `filters` state is the source of truth and we replace the URL
  // on every change (see below).
  useEffect(() => {
    if (!router.isReady || hydrated) return;
    const fromUrl = filtersFromQuery(router.query || {});
    setFilters(fromUrl);
    setHydrated(true);
  }, [router.isReady, router.query, hydrated]);

  // Mirror filter state back into the URL (shallow — no re-mount, no re-fetch
  // of anything else on the page). Runs only after hydration so we don't clobber
  // the initial URL read on the first render.
  useEffect(() => {
    if (!hydrated) return;
    const nextFilterQuery = filtersToQuery(filters);
    const filterKeys = ['class', 'sort', 'q', 'tags'];
    const currentFilterQuery = Object.fromEntries(
      Object.entries(router.query || {}).filter(([k]) => filterKeys.includes(k))
    );
    if (queriesEqual(currentFilterQuery, nextFilterQuery)) return;
    // Preserve any unrelated query params the app might set elsewhere and
    // rebuild only the filter slice of the URL.
    const preserved = Object.fromEntries(
      Object.entries(router.query || {}).filter(([k]) => !filterKeys.includes(k))
    );
    router.replace(
      { pathname: router.pathname, query: { ...preserved, ...nextFilterQuery } },
      undefined,
      { shallow: true, scroll: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.class, filters.sort, filters.q, filters.tags?.join(',')]);

  const runFetch = async (nextFilters, cursor = null) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError('');
    try {
      const res = await listBuilds({
        className: nextFilters.class,
        sort: nextFilters.sort,
        q: nextFilters.q || undefined,
        tag: nextFilters.tags?.length ? nextFilters.tags : undefined,
        cursor: cursor || undefined,
        limit: LANDING_SEED_LIMIT
      });
      if (id !== fetchIdRef.current) return;
      if (cursor) setItems((prev) => [...prev, ...(res?.items || [])]);
      else setItems(res?.items || []);
      setNextCursor(res?.nextCursor || null);
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      // The very first fetch (id === 1, fired ~250ms after mount) races the
      // seeded static props against the Worker. The seed exists precisely
      // because the Worker may be unreachable — that's the whole premise of
      // this branch — so if it fails, we already have seeded builds on
      // screen, and this request is asking for the exact slice the seed
      // represents (unfiltered, sort 'new', no cursor), keep showing the
      // seed instead of wiping a working page down to an error banner. Any
      // other failure (a filtered first fetch hydrated from the URL, a
      // filter change, pagination) is a real user-triggered request with no
      // matching seed to fall back on, so it keeps the original
      // clear-and-report behaviour.
      const canFallBackToSeed =
        id === 1 && !cursor && matchesSeedSlice(nextFilters) && initialBuilds?.length;
      if (canFallBackToSeed) {
        setNextCursor(null);
      } else {
        if (!cursor) setItems([]);
        setNextCursor(null);
        setError('Unable to load builds right now. Please try again.');
      }
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  };

  // Debounce filter changes so rapid chip-clicks / typing don't spam the API.
  // Tag toggling uses a longer window because users often click several chips
  // in succession; class / sort / text are snappier (tag joins into the key
  // so we can diff against the previous value to decide which delay to use).
  // Wait for URL hydration before firing so the first fetch uses the hydrated
  // filter set, not the default one.
  const debounceTimer = useRef(null);
  const prevTagsKey = useRef(filters.tags?.join(',') || '');
  const prevSort = useRef(filters.sort);
  const currentTagsKey = filters.tags?.join(',') || '';
  useEffect(() => {
    if (!router.isReady) return;
    const tagsChanged = prevTagsKey.current !== currentTagsKey;
    const sortChanged = prevSort.current !== filters.sort;
    prevTagsKey.current = currentTagsKey;
    prevSort.current = filters.sort;
    // Tag chips and sort buttons are both "try-a-few-quickly" controls — give
    // them a longer window so rapid toggles coalesce into a single fetch.
    const delay = tagsChanged || sortChanged ? 600 : 250;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runFetch(filters, null), delay);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, filters.class, filters.sort, filters.q, currentTagsKey]);

  const handleNew = () => {
    if (!signedIn) return;
    router.push('/tools/builds/new');
  };

  return (
    <>
      <NextSeo
        title="Builds | Idleon Toolbox"
        description="Browse and share optimized talent builds for every class and subclass in Legends of Idleon"
      />
      <BuildsBrowser
        subtitle="Community talent builds for every class and subclass."
        signedIn={signedIn}
        filters={filters}
        onFiltersChange={setFilters}
        builds={items}
        loading={loading}
        error={error}
        classSlugs={classSlugs}
        hasMore={!!nextCursor}
        onLoadMore={() => runFetch(filters, nextCursor)}
        onNewBuild={handleNew}
      />
    </>
  );
};

export default Builds;
