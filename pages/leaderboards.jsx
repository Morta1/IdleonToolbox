import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Snackbar, Stack } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Tabber from '../components/common/Tabber';
import { fetchMeta, fetchPlayer, fetchTab } from '../services/leaderboards';
import { trackLeaderboardEvent } from '@components/leaderboards/analytics';
import useLeaderboardSelf from '@hooks/useLeaderboardSelf';
import { FOCUS_RING, RUN_QUERY_KEYS, TABS, buildMetaIndex, rankText, staleUntilNextRun, untilNextRun } from '@components/leaderboards/format';
import ControlBar, { LeaderboardStatus } from '@components/leaderboards/ControlBar';
import Overview from '@components/leaderboards/Overview';
import CategoryTab from '@components/leaderboards/CategoryTab';
import BoardDrawer from '@components/leaderboards/BoardDrawer';

const tabOf = (value) => {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  if (lower === 'global') return 'overview'; // links from before the Overview tab
  return TABS.find((tab) => tab.toLowerCase() === lower)?.toLowerCase() ?? null;
};

const signature = (query) => JSON.stringify(Object.entries(query).sort(([a], [b]) => (a < b ? -1 : 1)));

const Leaderboards = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const self = useLeaderboardSelf();
  // Mantine reads storage in an effect, so the export and the first client render show the default.
  const [showAnonymous, setShowAnonymous] = useLocalStorage({ key: 'leaderboard:showAnonymous', defaultValue: true });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  // Where the sticky control bar ends: the tab strip pins right under it.
  const [stripTop, setStripTop] = useState(null);
  // How the open board was opened. A card or link click gets focus back from MUI; the board jump and a
  // deep link have nothing useful to return to, so closing focuses the board instead.
  const [openSource, setOpenSource] = useState(null);
  const showToast = (severity, message) => setToast({ open: true, severity, message });

  // Derived during render, never seeded into useState: router.query is {} until isReady on the
  // static export, and an initialiser would freeze a deep link on the fallback.
  const query = router.isReady ? router.query : {};
  // The URL alone decides the tab, so back and forward to a URL without ?t= land on Overview.
  const selectedTab = tabOf(query.t) ?? 'overview';
  const queryPlayer = typeof query.player === 'string' && query.player.trim() ? query.player.trim() : null;
  const queryMetric = typeof query.m === 'string' && query.m ? query.m : null;
  // Searching your own name keeps the "You" treatment. self.name is null until the stored Anon# id
  // has been read, so /player is never asked for the main character by mistake.
  const searchedSelf = Boolean(queryPlayer && self.name && queryPlayer.toLowerCase() === self.name.toLowerCase());
  const context = queryPlayer ? { name: queryPlayer, kind: searchedSelf ? 'logged' : 'searched' } : self.name ? { name: self.name, kind: 'logged' } : null;

  const metaQuery = useQuery({ queryKey: ['lb-meta'], queryFn: fetchMeta, staleTime: staleUntilNextRun, refetchInterval: untilNextRun });
  const index = buildMetaIndex(metaQuery.data);

  // A new run makes every cached tab, board and player stale at once, so the page never shows the
  // old run's numbers under the new run's time.
  const seenRun = useRef(null);
  useEffect(() => {
    if (!index.createdAt) return;
    if (seenRun.current && seenRun.current !== index.createdAt) {
      queryClient.invalidateQueries({ predicate: (query) => RUN_QUERY_KEYS.includes(query.queryKey[0]) });
    }
    seenRun.current = index.createdAt;
  }, [index.createdAt]);
  const tabQuery = useQuery({
    queryKey: ['leaderboard', selectedTab],
    queryFn: () => fetchTab(selectedTab),
    enabled: selectedTab !== 'overview',
    staleTime: staleUntilNextRun
  });
  const playerQuery = useQuery({
    queryKey: ['lb-player', context?.name.toLowerCase()],
    queryFn: () => fetchPlayer(context.name),
    enabled: Boolean(context),
    staleTime: staleUntilNextRun,
    retry: false
  });
  const playerData = playerQuery.data ?? null;

  // A metric that meta doesn't know (old link, typo) opens nothing. Without meta there is nothing to
  // check against, so boards stay reachable and the drawer falls back to the key-derived title.
  const canOpen = (metric) => Boolean(metric) && (metaQuery.isError || Object.hasOwn(index.byKey, metric));
  const drawerMetric = canOpen(queryMetric) ? queryMetric : null;
  // The drawer slides out for a moment after drawerMetric clears, so it keeps showing the last board.
  const [shownMetric, setShownMetric] = useState(null);
  if (drawerMetric && drawerMetric !== shownMetric) setShownMetric(drawerMetric);

  // What the visitor landed with, so URL-entry analytics fire once and never for in-page clicks.
  const urlEntry = useRef(null);
  useEffect(() => {
    if (!router.isReady || urlEntry.current) return;
    urlEntry.current = { player: queryPlayer, metric: queryMetric, playerTracked: false, metricTracked: false };
  }, [router.isReady]);

  useEffect(() => {
    const entry = urlEntry.current;
    if (!entry?.metric || entry.metricTracked || drawerMetric !== entry.metric || !Object.hasOwn(index.byKey, drawerMetric)) return;
    entry.metricTracked = true;
    trackLeaderboardEvent('lb_board_open', { metric: drawerMetric, source: 'url' });
  }, [drawerMetric]);

  useEffect(() => {
    const entry = urlEntry.current;
    if (!entry?.player || entry.playerTracked || queryPlayer !== entry.player || playerQuery.status !== 'success') return;
    entry.playerTracked = true;
    trackLeaderboardEvent('lb_player_search', { result: playerQuery.data ? 'found' : 'not_found', via: 'url' });
  }, [queryPlayer, playerQuery.status, playerQuery.data]);

  // An unknown ?player (bot link to a renamed or private player): say so, fall back to plain Boards.
  useEffect(() => {
    if (!queryPlayer || playerQuery.status !== 'success' || playerQuery.data !== null) return;
    showToast('warning', `No player named ${queryPlayer} on the leaderboards`);
    const { player, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [queryPlayer, playerQuery.status, playerQuery.data]);

  // The URL an in-page open pushed, so closing can step back over it instead of stacking a copy.
  const pushedOpen = useRef(null);

  const setQuery = (next, { replace = false } = {}) => {
    const navigate = replace ? router.replace : router.push;
    navigate({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  };

  const lookupPlayer = async (name, via) => {
    let data;
    try {
      data = await queryClient.fetchQuery({ queryKey: ['lb-player', name.toLowerCase()], queryFn: () => fetchPlayer(name), staleTime: staleUntilNextRun });
    } catch {
      showToast('error', 'Could not reach the leaderboards, try again');
      return;
    }
    trackLeaderboardEvent('lb_player_search', { result: data ? 'found' : 'not_found', via });
    if (!data) {
      showToast('warning', `No player named ${name} on the leaderboards`);
      return;
    }
    setQuery({ ...router.query, player: data.player.mainChar });
  };

  const openBoard = (metric, source) => {
    trackLeaderboardEvent('lb_board_open', { metric, source });
    setOpenSource(source);
    const next = { ...router.query, m: metric };
    const category = index.byKey[metric]?.category;
    if (source === 'jump' && category) next.t = TABS.find((tab) => tab.toLowerCase() === category);
    setQuery(next);
    // A jump to another tab lands there: closing drops the board but stays on that tab, rather than
    // stepping back to the tab the jump started from.
    const changedTab = (tabOf(next.t) ?? 'overview') !== selectedTab;
    pushedOpen.current = changedTab ? null : signature(next);
  };

  // Same URL Tabber writes for a click on the strip: the board in the drawer does not follow to another tab.
  const openTab = (tab) => {
    const { m, ...rest } = router.query;
    setQuery({ ...rest, t: tab });
  };

  const clearPlayer = () => {
    const { player, ...rest } = router.query;
    setQuery(rest);
  };

  // From the card's "Back to you" / "Clear", focus lands on the search field rather than the page
  // body; a touch screen is left alone so no keyboard pops up.
  const clearPlayerFromCard = () => {
    clearPlayer();
    if (!window.matchMedia?.('(hover: none)').matches) document.querySelector('input[aria-label="Find a player"]')?.focus();
  };

  const closeBoard = () => {
    const wasPushed = pushedOpen.current === signature(router.query);
    pushedOpen.current = null;
    if (wasPushed) {
      router.back();
      return;
    }
    const { m, ...rest } = router.query;
    setQuery(rest, { replace: true });
  };

  const highlight = {};
  if (self.name) highlight[self.name] = 'logged';
  if (context?.kind === 'searched' && playerData) highlight[playerData.player.mainChar] = 'searched';
  const pinnedBase = playerData && context ? { mainChar: playerData.player.mainChar, kind: context.kind, globalRank: playerData.player.rank } : null;
  const tabData = tabQuery.data?.[selectedTab];
  const statusCreatedAt = index.createdAt ?? tabQuery.data?.createdAt ?? null;
  const tabLabels = TABS.map((tab) => {
    const count = index.categories[tab.toLowerCase()]?.metrics.length;
    return count ? <>{tab}<Box component="span" sx={{ ml: 0.75, fontSize: 11, color: 'text.disabled', display: { xs: 'none', sm: 'inline' } }}>{count}</Box></> : tab;
  });

  // Picking a player changes the whole page without moving focus; this says what changed.
  const announcement = playerData && context ? `Showing ${playerData.player.mainChar}, global rank ${rankText(playerData.player.rank)}` : '';

  return <Box sx={FOCUS_RING}>
    <Box role="status" aria-live="polite" sx={visuallyHidden}>{announcement}</Box>
    <NextSeo
      title="Leaderboards | Idleon Toolbox"
      description="View Legends of Idleon leaderboards for skills, tasks, characters, caverns, and more with player rankings and stats"
    />
    <ControlBar
      index={index}
      totalPlayers={index.totalPlayers}
      createdAt={statusCreatedAt}
      showAnonymous={showAnonymous}
      onToggleAnonymous={(event, checked) => setShowAnonymous(checked)}
      onPlayer={lookupPlayer}
      onMetric={(metric) => openBoard(metric, 'jump')}
      onStickyBottom={setStripTop}
      viewing={queryPlayer ? { name: playerData?.player.mainChar ?? queryPlayer, kind: context.kind } : null}
      onClearPlayer={clearPlayer}
    />
    <Tabber
      tabs={TABS}
      components={tabLabels}
      align="start"
      stickyTop={stripTop ?? undefined}
      idPrefix="lb"
      // The strip has room for the status line only on wide screens; below that it sits in the control bar.
      endSlot={<Box sx={{ display: { xs: 'none', xl: 'block' } }}><LeaderboardStatus totalPlayers={index.totalPlayers} createdAt={statusCreatedAt}/></Box>}
      activeTab={TABS.findIndex((tab) => tab.toLowerCase() === selectedTab)}
      clearOnChange={['m']}
      keepChildren>
      {selectedTab === 'overview' ? (
        <Overview
          index={index}
          showAnonymous={showAnonymous}
          highlight={highlight}
          self={self}
          player={{ context, data: playerQuery.data, isLoading: playerQuery.isLoading, isError: playerQuery.isError, refetch: playerQuery.refetch }}
          onOpen={openBoard}
          onTab={openTab}
          onClearPlayer={clearPlayerFromCard}
        />
      ) : tabQuery.isError ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => tabQuery.refetch()}>Retry</Button>}>
          Could not load these boards
        </Alert>
      ) : !tabData ? (
        <Stack alignItems="center" justifyContent="center" mt={3}><CircularProgress/></Stack>
      ) : (
        <CategoryTab
          key={selectedTab}
          category={selectedTab}
          index={index}
          lists={showAnonymous ? tabData.anonymous : tabData.public}
          showAnonymous={showAnonymous}
          ranks={playerData?.ranks}
          highlight={highlight}
          pinnedBase={pinnedBase}
          onOpen={(metric) => openBoard(metric, 'card')}
        />
      )}
    </Tabber>
    <BoardDrawer
      open={Boolean(drawerMetric)}
      metricKey={drawerMetric ?? shownMetric}
      index={index}
      player={playerData?.player.mainChar ?? null}
      kind={context?.kind}
      rankEntry={playerData?.ranks?.[drawerMetric ?? shownMetric] ?? null}
      focusBoardOnClose={openSource == null || openSource === 'jump'}
      showAnonymous={showAnonymous}
      onClose={closeBoard}
    />
    <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
    </Snackbar>
  </Box>;
};

export default Leaderboards;
