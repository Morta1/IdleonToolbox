import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Menu,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { PillTextField, TagChip } from '@components/tools/builds/styled';
import ClassPicker from '@components/tools/builds/ClassPicker';
import SimpleLoader from '@components/common/SimpleLoader';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BoltIcon from '@mui/icons-material/Bolt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ClearIcon from '@mui/icons-material/Clear';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import BuildCard from '@components/tools/builds/BuildCard';
import { listBuilds } from 'services/builds';
import { ACCENT } from '@utility/builds/classes';
import { TAG_OPTIONS } from '@utility/builds/tags';
import Tooltip from 'components/Tooltip';

const INITIAL_FILTERS = {
  class: null,
  sort: 'new',
  q: '',
  tags: []
};

// 'hot' is temporarily disabled: the hotScore aging math makes older-liked-once
// builds outrank newer-liked-once ones, which is misleading. Re-enable once
// there's a Cron Trigger recomputing hotScore on a schedule.
const VALID_SORTS = new Set(['new', 'top']);

// URL <-> filters helpers. We keep the URL as a serialisation of user-visible
// filters only (class / sort / tags / search). Cursor-based pagination stays
// in memory — a shareable link is always "show the first page of this slice".
const filtersFromQuery = (query) => {
  const cls = typeof query.class === 'string' && query.class ? query.class : null;
  const sort = typeof query.sort === 'string' && VALID_SORTS.has(query.sort) ? query.sort : 'new';
  const q = typeof query.q === 'string' ? query.q : '';
  const tagsRaw = typeof query.tags === 'string' ? query.tags : '';
  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
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

const SORTS = [
  // Temporarily disabled — see VALID_SORTS comment above.
  // { value: 'hot', label: 'Hot', icon: <LocalFireDepartmentIcon sx={{ fontSize: 16 }}/> },
  { value: 'new', label: 'New', icon: <BoltIcon sx={{ fontSize: 16 }}/> },
  { value: 'top', label: 'Top', icon: <TrendingUpIcon sx={{ fontSize: 16 }}/> }
];

// -- Pill-shaped filter trigger ---------------------------------------------

const FilterPill = ({ label, value, count, onClick, active }) => (
  <Button
    onClick={onClick}
    sx={{
      textTransform: 'none',
      borderRadius: 999,
      height: 36,
      px: 2,
      background: active ? ACCENT.primarySoft : 'rgba(255,255,255,0.04)',
      color: active ? ACCENT.primary : 'rgba(255,255,255,0.85)',
      border: `1px solid ${active ? ACCENT.primaryBorder : 'rgba(255,255,255,0.08)'}`,
      fontWeight: 500,
      '&:hover': {
        background: active ? ACCENT.primarySoft : 'rgba(255,255,255,0.07)',
        borderColor: active ? ACCENT.primaryBorder : 'rgba(255,255,255,0.14)'
      }
    }}
  >
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        lineHeight: 1
      }}
    >
      <Box
        component="span"
        sx={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          color: active ? ACCENT.primary : 'rgba(255,255,255,0.55)'
        }}
      >
        {label}
      </Box>
      {value && (
        <Box component="span" sx={{ fontSize: 13, lineHeight: 1 }}>
          {value}
        </Box>
      )}
      {count > 0 && !value && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            minWidth: 18,
            height: 18,
            lineHeight: '18px',
            textAlign: 'center',
            px: '5px',
            fontSize: 10,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            borderRadius: 999,
            color: '#fff',
            background: ACCENT.primary
          }}
        >
          {count}
        </Box>
      )}
      <KeyboardArrowDownIcon sx={{ fontSize: 18, opacity: 0.75 }}/>
    </Box>
  </Button>
);

// -- Page --------------------------------------------------------------------

const Builds = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
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
        limit: 24
      });
      if (id !== fetchIdRef.current) return;
      if (cursor) setItems((prev) => [...prev, ...(res?.items || [])]);
      else setItems(res?.items || []);
      setNextCursor(res?.nextCursor || null);
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      if (!cursor) setItems([]);
      setNextCursor(null);
      setError('Unable to load builds right now. Please try again.');
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

  const toggleTag = (tag) => {
    setFilters((prev) => {
      const has = prev.tags.includes(tag);
      return {
        ...prev,
        tags: has ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag]
      };
    });
  };

  const activeFilterCount = (filters.class ? 1 : 0) + (filters.tags?.length || 0);

  return (
    <>
      <NextSeo
        title="Builds | Idleon Toolbox"
        description="Browse and share optimized talent builds for every class and subclass in Legends of Idleon"
      />

      {/* Header with subtle accent glow behind the title */}
      <Box
        sx={{
          position: 'relative',
          mt: 2,
          mb: 3,
          pb: 2,
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '1px',
            background:
              'linear-gradient(90deg, rgba(32,135,232,0.35) 0%, rgba(32,135,232,0) 40%)'
          }
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'flex-end' }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: -0.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              Builds
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Community talent builds for every class and subclass.
            </Typography>
          </Box>
          <Stack direction="row" gap={1}>
            <Tooltip title={signedIn ? '' : 'Sign in to see your builds'}>
              {/* span wrapper: MUI Tooltip can't bind pointer events to a disabled button. */}
              <span>
                <Button
                  variant="outlined"
                  sx={{ borderRadius: 999 }}
                  component={Link}
                  href="/tools/builds/my-builds"
                  startIcon={<PersonIcon/>}
                  disabled={!signedIn}
                >
                  My builds
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={signedIn ? '' : 'Sign in to create a build'}>
              <span>
                <Button
                  sx={{ borderRadius: 999 }}
                  variant="contained"
                  startIcon={<AddIcon/>}
                  onClick={handleNew}
                  disabled={!signedIn}
                >
                  New Build
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Search row — distinct rounded pill */}
      <PillTextField
        size="small"
        placeholder="Search builds, titles, notes…"
        value={filters.q}
        onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        fullWidth
        sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { pl: 0.5 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.55)', ml: 0.5 }}/>
            </InputAdornment>
          ),
          endAdornment: filters.q ? (
            <InputAdornment position="end">
              <Button
                size="small"
                onClick={() => setFilters({ ...filters, q: '' })}
                sx={{ minWidth: 0, p: 0.5, color: 'rgba(255,255,255,0.55)' }}
              >
                <ClearIcon fontSize="small"/>
              </Button>
            </InputAdornment>
          ) : null
        }}
      />

      {/* Pill filter row */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
        sx={{ mb: 3 }}
      >
        <ClassPicker
          value={filters.class}
          onChange={(next) => setFilters({ ...filters, class: next || null })}
          label="Class"
          placeholder="Any"
        />
        <FilterPill
          label="Tags"
          count={filters.tags?.length || 0}
          active={(filters.tags?.length || 0) > 0}
          onClick={(e) => setTagsAnchor(e.currentTarget)}
        />
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={() => setFilters({ ...INITIAL_FILTERS, sort: filters.sort })}
            sx={{
              textTransform: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12
            }}
          >
            Clear all
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }}/>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.sort}
          onChange={(_, v) => v && setFilters({ ...filters, sort: v })}
          sx={{
            borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            p: 0.25,
            gap: 0.25,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 1.5,
              height: 30,
              border: 0,
              borderRadius: '999px !important',
              color: 'rgba(255,255,255,0.6)',
              '&:hover': { background: 'rgba(255,255,255,0.04)' }
            },
            '& .Mui-selected': {
              bgcolor: `${ACCENT.primarySoft} !important`,
              color: `${ACCENT.primary} !important`
            }
          }}
        >
          {SORTS.map((s) => (
            <ToggleButton key={s.value} value={s.value}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  lineHeight: 1,
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {s.icon}
                <span>{s.label}</span>
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {/* Tags popover */}
      <Menu
        anchorEl={tagsAnchor}
        open={!!tagsAnchor}
        onClose={() => setTagsAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 1.5,
              maxWidth: 360,
              borderRadius: 2
            }
          }
        }}
      >
        <Stack gap={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Tags</Typography>
            {filters.tags?.length > 0 && (
              <Button
                size="small"
                onClick={() => setFilters({ ...filters, tags: [] })}
                sx={{ textTransform: 'none', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
              >
                Clear
              </Button>
            )}
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {TAG_OPTIONS.map((tag) => {
              const selected = (filters.tags || []).includes(tag);
              return (
                <TagChip
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => toggleTag(tag)}
                  sx={selected ? {
                    bgcolor: ACCENT.primarySoft,
                    color: ACCENT.primary,
                    borderColor: ACCENT.primaryBorder
                  } : undefined}
                />
              );
            })}
          </Stack>
        </Stack>
      </Menu>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && items.length === 0 ? (
        <SimpleLoader message="Loading builds…"/>
      ) : items.length === 0 ? (
        <Stack
          alignItems="center"
          sx={{
            py: 8,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed rgba(255,255,255,0.08)',
            background:
              'radial-gradient(600px 200px at 50% 0%, rgba(32,135,232,0.06), transparent 70%)'
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
            {activeFilterCount > 0 || filters.q
              ? 'No builds match these filters.'
              : 'No builds yet.'}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            {activeFilterCount > 0 || filters.q
              ? 'Try clearing a filter, or publish the first build in this slice.'
              : 'Be the first to publish one.'}
          </Typography>
          <Button
            variant="contained"
            onClick={handleNew}
            disabled={!signedIn}
            startIcon={<AddIcon/>}
            size="small"
          >
            New Build
          </Button>
        </Stack>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))'
            }}
          >
            {items.map((b) => (
              <BuildCard key={b.shortId} build={b}/>
            ))}
          </Box>
          {nextCursor && (
            <Stack alignItems="center" sx={{ my: 3 }}>
              <Button
                onClick={() => runFetch(filters, nextCursor)}
                disabled={loading}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  px: 3,
                  borderRadius: 999,
                  textTransform: 'none'
                }}
              >
                {loading ? 'Loading…' : 'Load More'}
              </Button>
            </Stack>
          )}
        </>
      )}
    </>
  );
};

export default Builds;
