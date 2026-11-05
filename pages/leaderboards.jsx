import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Tabber from '../components/common/Tabber';
import { fetchMeta, fetchPlayer, fetchTab } from '../services/leaderboards';
import { trackLeaderboardEvent } from '@components/leaderboards/analytics';
import useLeaderboardSelf from '@hooks/useLeaderboardSelf';
import { RUN_QUERY_KEYS, TABS, buildMetaIndex, rankText, showsFailure, staleUntilNextRun, untilNextRun } from '@components/leaderboards/format';
import { focusWithinRing } from '../styles/theme/darkTheme';
import ControlBar, { LeaderboardStatus } from '@components/leaderboards/ControlBar';
import Overview from '@components/leaderboards/Overview';
import CategoryTab from '@components/leaderboards/CategoryTab';
import BoardDrawer from '@components/leaderboards/BoardDrawer';
import Notice, { retryAction } from '@components/common/Notice';

const tabOf = (value) => {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  if (lower === 'global') return 'overview'; // links from before the Overview tab
  return TABS.find((tab) => tab.toLowerCase() === lower)?.toLowerCase() ?? null;
};

const signature = (query) => JSON.stringify(Object.entries(query).sort(([a], [b]) => (a < b ? -1 : 1)));

// The drawer's width (AppDrawer) and the gap the cards keep from it.
const DRAWER_WIDTH = 420;
const DRAWER_GAP = 16;

// Where the search note hands the focus once it goes (its x, or a retry that found the player).
const findPlayerField = () => document.querySelector('input[aria-label="Find a player"]');

const Leaderboards = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const self = useLeaderboardSelf();
  // Mantine reads storage in an effect, so the export and the first client render show the default.
  const [showAnonymous, setShowAnonymous] = useLocalStorage({ key: 'leaderboard:showAnonymous', defaultValue: true });
  // The answer to a player search: a note in the toolbar until the next search, a found player or its x.
  const [searchNote, setSearchNote] = useState(null);
  // Where the sticky control bar ends: the tab strip pins right under it.
  const [stripTop, setStripTop] = useState(null);
  // How the open board was opened. A card or link click gets focus back from MUI; the board jump and a
  // deep link have nothing useful to return to, so closing focuses the board instead.
  const [openSource, setOpenSource] = useState(null);
  // Each answer is a note of its own, so one that repeats (a Retry that failed again) is read out again.
  const showSearchNote = (note) => setSearchNote((previous) => ({ ...note, id: (previous?.id ?? 0) + 1 }));

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
  // A reply with no player is no player: the same note as a 404.
  const playerData = playerQuery.data?.player ? playerQuery.data : null;

  // A metric that meta doesn't know (old link, typo) opens nothing. Without meta there is nothing to
  // check against, so boards stay reachable and the drawer falls back to the key-derived title.
  const knowsNoBoards = metaQuery.isError || (metaQuery.isSuccess && !Object.keys(index.categories).length);
  const canOpen = (metric) => Boolean(metric) && (knowsNoBoards || Object.hasOwn(index.byKey, metric));
  const drawerMetric = canOpen(queryMetric) ? queryMetric : null;
  // The drawer slides out for a moment after drawerMetric clears, so it keeps showing the last board.
  const [shownMetric, setShownMetric] = useState(null);
  if (drawerMetric && drawerMetric !== shownMetric) setShownMetric(drawerMetric);

  const boardsRef = useRef(null);
  const [drawerRoom, setDrawerRoom] = useState(0);
  const boardsShown = Boolean(drawerMetric) && selectedTab !== 'overview' && Boolean(tabQuery.data?.[selectedTab]) && !metaQuery.isPending;
  useEffect(() => {
    const boards = boardsRef.current;
    if (!boardsShown || !boards || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      const uncovered = document.documentElement.clientWidth - boards.getBoundingClientRect().right;
      setDrawerRoom(Math.max(0, DRAWER_WIDTH + DRAWER_GAP - uncovered));
    });
    observer.observe(boards);
    return () => observer.disconnect();
  }, [boardsShown]);

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
    trackLeaderboardEvent('lb_player_search', { result: playerData ? 'found' : 'not_found', via: 'url' });
  }, [queryPlayer, playerQuery.status, playerQuery.data]);

  // An unknown ?player (bot link to a renamed or private player): say so, fall back to plain Boards.
  useEffect(() => {
    if (!queryPlayer || playerQuery.status !== 'success' || playerData) return;
    showSearchNote({ tone: 'info', text: `No player named ${queryPlayer} on the leaderboards.` });
    const { player, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [queryPlayer, playerQuery.status, playerQuery.data]);

  // The URL an in-page open pushed, so closing can step back over it instead of stacking a copy.
  const pushedOpen = useRef(null);

  const setQuery = (next, { replace = false } = {}) => {
    const navigate = replace ? router.replace : router.push;
    navigate({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  };

  // A link from before the regroup (?t=Misc&m=redoxSaltRank) names a tab that is gone: move it to
  // the board's tab once meta says where that is. No ?t= is Overview and stays there.
  const movedTab = TABS.find((tab) => tab.toLowerCase() === index.byKey[queryMetric]?.category);
  const staleTab = typeof query.t === 'string' && tabOf(query.t) === null;
  useEffect(() => {
    if (!router.isReady || !staleTab || !queryMetric || !movedTab) return;
    setQuery({ ...router.query, t: movedTab }, { replace: true });
  }, [query.t, queryMetric, movedTab]);

  // A new search clears the last answer; a retry keeps its note up, busy, until its own answer.
  const lookupPlayer = async (name, via, { retrying = false } = {}) => {
    setSearchNote((previous) => (retrying && previous ? { ...previous, busy: true } : null));
    let data;
    try {
      data = await queryClient.fetchQuery({ queryKey: ['lb-player', name.toLowerCase()], queryFn: () => fetchPlayer(name), staleTime: staleUntilNextRun });
    } catch {
      showSearchNote({ tone: 'error', text: 'Could not reach the leaderboards.', retry: () => lookupPlayer(name, via, { retrying: true }) });
      return;
    }
    trackLeaderboardEvent('lb_player_search', { result: data?.player ? 'found' : 'not_found', via });
    if (!data?.player) {
      showSearchNote({ tone: 'info', text: `No player named ${name} on the leaderboards.` });
      return;
    }
    setSearchNote(null);
    setQuery({ ...router.query, player: data.player.mainChar });
  };

  // A click on another board's opener while a board is open reaches the drawer's click-away right after the
  // opener: that close would undo the switch, so a close in the same click as an open is dropped.
  const openedThisClick = useRef(false);

  const openBoard = (metric, source) => {
    trackLeaderboardEvent('lb_board_open', { metric, source });
    // Another board while one is open takes its place in the history too, so closing it steps back past
    // both, not to the first board.
    const switching = Boolean(router.query.m);
    // The drawer stays open on a switch, so what MUI would hand the focus back to is the first board's opener:
    // closing focuses the board on screen instead.
    setOpenSource(switching ? 'switch' : source);
    const next = { ...router.query, m: metric };
    // A board whose tab the site does not know (worker ahead of the site) opens on the current tab.
    const tab = TABS.find((entry) => entry.toLowerCase() === index.byKey[metric]?.category);
    if (source === 'jump' && tab) next.t = tab;
    setQuery(next, { replace: switching });
    // A jump to another tab lands there: closing drops the board but stays on that tab, rather than
    // stepping back to the tab the jump started from.
    const changedTab = (tabOf(next.t) ?? 'overview') !== selectedTab;
    const pushed = switching ? pushedOpen.current !== null : true;
    pushedOpen.current = changedTab || !pushed ? null : signature(next);
    openedThisClick.current = true;
    setTimeout(() => {
      openedThisClick.current = false;
    }, 0);
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
    if (openedThisClick.current) return;
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
    return count ? <>{tab}<Box component="span" sx={{ ml: 0.75, typography: 'caption', color: 'text.muted', display: { xs: 'none', sm: 'inline' } }}>{count}</Box></> : tab;
  });

  // Picking a player changes the whole page without moving focus; this says what changed, and reads out the
  // answer to a search that found no one.
  const announcement = searchNote?.text ?? (playerData && context ? `Showing ${playerData.player.mainChar}, global rank ${rankText(playerData.player.rank)}` : '');

  return <Box sx={focusWithinRing}>
    <Box role="status" aria-live="polite" sx={visuallyHidden}>{announcement}</Box>
    <NextSeo
      title="Leaderboards | Idleon Toolbox"
      description="View Legends of Idleon leaderboards for your account, characters, skills, combat and every world, with player rankings and stats"
    />
    {showsFailure(metaQuery)
      ? <Notice key={metaQuery.errorUpdateCount} tone={'error'} sx={{ mb: 2 }} action={retryAction(() => metaQuery.refetch(), metaQuery.isFetching)}>
        Couldn't load the board list, so counts, tiles and board names are missing.
      </Notice>
      : null}
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
      // An emptied field takes the last answer with it, rather than leaving it to follow to the other tabs.
      onSearchEmptied={() => setSearchNote(null)}
      note={searchNote ? <Notice key={searchNote.id} tone={searchNote.tone} onDismiss={() => setSearchNote(null)} focusAfter={findPlayerField}
                                 action={searchNote.retry ? retryAction(searchNote.retry, searchNote.busy) : undefined}>
        {searchNote.text}
      </Notice> : null}
    />
    <Tabber
      tabs={TABS}
      components={tabLabels}
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
          player={{ context, data: playerQuery.data === undefined ? undefined : playerData, isLoading: playerQuery.isLoading, isError: showsFailure(playerQuery), refetch: playerQuery.refetch,
            isFetching: playerQuery.isFetching, errorUpdateCount: playerQuery.errorUpdateCount }}
          onOpen={openBoard}
          onTab={openTab}
          onClearPlayer={clearPlayerFromCard}
          linkPlayer={queryPlayer}
        />
      ) : showsFailure(tabQuery) ? (
        <Notice key={tabQuery.errorUpdateCount} tone={'error'} action={retryAction(() => tabQuery.refetch(), tabQuery.isFetching)}>Could not load these boards.</Notice>
      ) : !tabData && tabQuery.isSuccess ? (
        // A run with nothing for this tab answers too: a note, not a spinner that never stops.
        <Notice>No boards in this tab yet.</Notice>
      ) : !tabData || metaQuery.isPending ? (
        // The cards wait for meta: without it they draw one unnamed section with key-derived titles, then regroup.
        <Stack alignItems="center" justifyContent="center" mt={3}><CircularProgress/></Stack>
      ) : (
        // An open board covers the page's right side by what the ad column beside it leaves: the cards make room, so every
        // "Top 100" stays clickable. Measured, since that column comes and goes; a phone's drawer is a sheet.
        <Box ref={boardsRef} sx={{ pr: { md: drawerMetric ? `${drawerRoom}px` : 0 } }}>
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
            revealMetric={drawerMetric}
            linkPlayer={queryPlayer}
          />
        </Box>
      )}
    </Tabber>
    <BoardDrawer
      open={Boolean(drawerMetric)}
      metricKey={drawerMetric ?? shownMetric}
      index={index}
      player={playerData?.player.mainChar ?? null}
      kind={context?.kind}
      rankEntry={playerData?.ranks?.[drawerMetric ?? shownMetric] ?? null}
      focusBoardOnClose={openSource == null || openSource === 'jump' || openSource === 'switch'}
      showAnonymous={showAnonymous}
      onClose={closeBoard}
    />
  </Box>;
};

export default Leaderboards;
