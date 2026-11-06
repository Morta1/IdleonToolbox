import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  inputBaseClasses,
  Link,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { IconBook2, IconClock, IconHeartFilled, IconSearch } from '@tabler/icons-react';
import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import { startTransition, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { prefix } from '@utility/helpers';
import { trackEvent } from '@utility/analytics';
import { sessionQuery } from '@utility/nav-query';
import {
  addRecent, emptyBox, PINS_SHOWN, recentEntry, searchToolbox, WIKI_MAX, WIKI_SHOWN, wikiMatches, wikiRow
} from '@utility/search/quickSearch';
import { AppContext, shownCharacters, shownFilters } from '@components/common/context/AppProvider';
import usePin from '@components/common/favorites/usePin';
import EntityIcon from '@components/wiki/EntityIcon';
import { touchTarget } from '../../styles/theme/theme';
import Notice from '@components/common/Notice';
import { isModifiedClick } from '@components/wiki/links';

const hrefOf = ({ pathname, query }) => {
  const search = new URLSearchParams(query).toString();
  return search ? `${pathname}?${search}` : pathname;
};

// One page and query, whatever the parameters' order or a trailing slash.
const sameUrl = (a, b) => {
  const [first, second] = [a, b].map((url) => {
    const parsed = new URL(url, 'http://toolbox.local');
    parsed.searchParams.sort();
    return `${parsed.pathname.replace(/(.)\/$/, '$1')}?${parsed.searchParams}`;
  });
  return first === second;
};

// The wiki's index (7,600 names) loads when the panel first opens, never with a page. Injectable for tests,
// as WikiSearchBar's is: the same chunk serves both.
const defaultLoadWikiEntries = () => import('../../data/wiki-search-index.json').then((mod) => mod.default || mod);

// The row the arrows picked is a band across the whole panel on the blue tint, with a bar at the panel's left edge, so it
// reads apart from the row under the pointer, which only tints.
const ROW_SX = (selected) => ({
  listStyle: 'none', position: 'relative', px: 2, py: '6px', minHeight: 52, boxSizing: 'border-box',
  display: 'flex', alignItems: 'center', gap: 1.5,
  bgcolor: selected ? 'primary.soft' : 'transparent', '&:hover': { bgcolor: selected ? 'primary.soft' : 'action.hover' },
  boxShadow: selected ? 'inset 3px 0 0 var(--mui-palette-primary-main)' : 'none'
});
// A page's tab inside its row: a 26 px outlined pill, whose tap target reaches 44 px on a coarse pointer.
const TAB_PILL_SX = {
  position: 'relative', display: 'inline-flex', alignItems: 'center', height: 26, px: '9px', borderRadius: 999, border: 1,
  borderColor: 'divider', fontSize: 12.5, color: 'text.secondary', '&:hover': { color: 'text.primary', borderColor: 'outline' },
  '@media (pointer: coarse)': { '&::before': { content: '""', position: 'absolute', inset: '-9px 0' } }
};
// A group's label, with the Search board's 14 px glyph on the two groups of the empty box.
const GroupTitle = ({ icon: Icon, children }) => <Typography variant="groupLabel" component="div" color="text.secondary"
                                                             sx={{ px: 2, py: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
  {Icon ? <Icon size={14} aria-hidden/> : null}
  {children}
</Typography>;
// A key as a key cap (Search board).
const Kbd = ({ sx, ...props }) => <Box component="kbd" {...props} sx={[{
  display: 'inline-flex', alignItems: 'center', height: 22, px: 0.75, border: 1, borderColor: 'outline', borderRadius: 1,
  fontSize: 11.5, color: 'text.secondary', fontFamily: 'inherit'
}, sx]}/>;
const KeyHint = ({ keys, children }) => <Stack component="span" direction="row" alignItems="center" gap={0.75}>
  {keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
  {children}
</Stack>;

// A row with no art (NPCs, quests, the art the game never shipped) shows a muted book, not an empty slot.
const RowIcon = ({ row }) => {
  const node = row.entry ?? { icon: row.icon ? `${prefix}${row.icon}.png` : null };
  if (node.icon) return <EntityIcon node={node} size={32}/>;
  return <Box aria-hidden sx={{ width: 32, height: 32, flexShrink: 0, display: 'grid', placeItems: 'center', color: 'text.muted' }}>
    <IconBook2 size={20}/>
  </Box>;
};

// The row's main link stretches over the row; its tab links sit above that, so a tap on the row opens the
// page and a tap on a tab opens the tab. Real anchors: middle click and "open in new tab" work.
const ResultRow = ({ row, selected, onOpen, hrefFor }) => <Box component="li" data-selected={selected || undefined}
                                                               sx={ROW_SX(selected)}>
  <RowIcon row={row}/>
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Link href={hrefFor(row.href)} onClick={onOpen(row, row.href)} underline="none" color="text.primary"
          sx={{ display: 'block', fontSize: 15, fontWeight: 500, '&::after': { content: '""', position: 'absolute', inset: 0 } }}>
      {row.label}
      {/* Tells a same-name entry apart, as the wiki's own search does. */}
      {row.disambig ? <Typography component="span" variant="body2" color="text.secondary">{` ${row.disambig}`}</Typography> : null}
    </Link>
    {row.note ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 12.5 }}>{row.note}</Typography> : null}
    {row.tabs?.length ? <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ position: 'relative', zIndex: 1, mt: 0.5 }}>
      {row.tabs.map((tab) => <Link key={tab.label} href={hrefFor(tab.href)} onClick={onOpen(row, tab.href)} underline="none" sx={TAB_PILL_SX}>
        {tab.label}
      </Link>)}
    </Stack> : null}
  </Box>
</Box>;

const QuickSearch = ({ loadWikiEntries = defaultLoadWikiEntries }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAllBreakdowns, setShowAllBreakdowns] = useState(false);
  const [showAllPins, setShowAllPins] = useState(false);
  const [showAllWiki, setShowAllWiki] = useState(false);
  const [wikiEntries, setWikiEntries] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  // Read only by the open panel, which never renders at build.
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const router = useRouter();
  const { state, dispatch } = useContext(AppContext);
  const { pinnedPages } = usePin();
  const updateQuery = sessionQuery(router?.query);

  // The pages left on this device, newest first. No default: a visitor who never moves writes nothing.
  const [recent, setRecent] = useLocalStorage({ key: 'search:recent' });
  // The page on screen, kept for the moment the player leaves it. A full page load fires no route change,
  // so only in-app moves are recorded.
  const shown = useRef(null);
  useEffect(() => {
    const events = router?.events;
    if (!events) return undefined;
    shown.current = router.asPath;
    const onDone = (url) => {
      const left = recentEntry(shown.current);
      shown.current = url;
      if (left) setRecent((list) => addRecent(list, left));
    };
    // A route change closes the panel: a result, or the browser's back on a desktop.
    const onStart = () => setSearchOpen(false);
    events.on('routeChangeStart', onStart);
    events.on('routeChangeComplete', onDone);
    return () => {
      events.off('routeChangeStart', onStart);
      events.off('routeChangeComplete', onDone);
    };
  }, []);

  // On a phone the panel fills the screen, so Back is how a player leaves it. The open panel gets a history
  // entry of its own (the same URL): Back steps off it and closes the panel, and the page stays put. Every
  // other way out steps off it too, and a result replaces it (or steps off it, for the page on screen), so leaving
  // that page takes one Back.
  // 'open' while the entry is the current one, 'leaving' once a close has asked the browser to step off it.
  const panelEntry = useRef(null);
  // The way out as of the last render (closePanel, set below), for the listener, which is added once.
  const closeOnBack = useRef(null);
  useEffect(() => {
    // Stepping off the entry lands on the same URL, which Next would route to again.
    router?.beforePopState?.(() => !panelEntry.current);
    const onPop = () => {
      const was = panelEntry.current;
      panelEntry.current = null;
      if (was === 'open') closeOnBack.current?.();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      router?.beforePopState?.(() => true);
    };
  }, []);
  const leavePanelEntry = () => {
    if (panelEntry.current !== 'open') return;
    panelEntry.current = 'leaving';
    window.history.back();
  };

  useEffect(() => {
    if (!searchOpen || wikiEntries) return undefined;
    let alive = true;
    loadWikiEntries().then((loaded) => {
      if (alive) setWikiEntries(loaded);
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, [searchOpen]);

  const term = searchTerm.trim();
  const results = searchToolbox(searchTerm, { allBreakdowns: showAllBreakdowns });
  const wiki = wikiMatches(wikiEntries, term);
  const wikiLoading = term.length >= 2 && !wikiEntries;
  // Close matches give way to the wiki ("copper" would read as Clam Work's Compensations), and wait for it
  // while it loads, so a fast "copper" never flashes them. Exact rows never mix with close ones.
  const closeHidden = Boolean(results.closeTo) && (wiki.length > 0 || wikiLoading);
  const closeTo = closeHidden ? null : results.closeTo;
  // Up to WIKI_MAX on request; past that, a line says how many matched and how to narrow them (the wiki's
  // own search bar stops at 30 too, and takes no term from a link).
  const wikiShown = Math.min(wiki.length, showAllWiki ? WIKI_MAX : WIKI_SHOWN);
  const wikiGroup = wiki.length ? {
    key: 'wiki', title: 'Wiki', rows: wiki.slice(0, wikiShown).map(wikiRow),
    more: !showAllWiki && wiki.length > WIKI_SHOWN
      ? { label: `Show ${Math.min(wiki.length, WIKI_MAX) - WIKI_SHOWN} more wiki results`, open: () => setShowAllWiki(true) }
      : null,
    note: showAllWiki && wiki.length > WIKI_MAX ? `The first ${WIKI_MAX} of ${wiki.length} wiki results: add a word to narrow them.` : null
  } : null;
  // GA's results_count: the toolbox's exact rows and the wiki's.
  const count = results.count + wiki.length;
  const box = emptyBox({ pins: pinnedPages, recent, currentUrl: router?.pathname });
  const pinsHidden = showAllPins ? 0 : Math.max(0, box.pins.length - PINS_SHOWN);
  // A term shows the toolbox's results; the empty box shows the pinned pages, then the recent ones
  // (Search board, "Useful when empty").
  const groups = term
    ? [
      ...(closeHidden ? [] : results.groups).map((group) => ({
        ...group,
        more: group.hidden ? { label: `Show ${group.hidden} more breakdowns`, open: () => setShowAllBreakdowns(true) } : null
      })),
      ...(wikiGroup ? [wikiGroup] : [])
    ]
    : [
      {
        key: 'pinned', title: 'Pinned', icon: IconHeartFilled, rows: box.pins.slice(0, box.pins.length - pinsHidden),
        more: pinsHidden ? { label: `Show ${pinsHidden} more pinned`, open: () => setShowAllPins(true) } : null
      },
      { key: 'recent', title: 'Recent', icon: IconClock, rows: box.recent, more: null }
    ].filter((group) => group.rows.length);
  // What the arrow keys move through, in display order: each row, and each group's expander.
  const targets = groups.flatMap((group) => [
    ...group.rows.map((row) => ({ key: row.key, row })),
    ...(group.more ? [{ key: `more:${group.key}`, more: group.more }] : [])
  ]);
  const indexOf = new Map(targets.map(({ key }, index) => [key, index]));

  // One event per search rather than one per keystroke: GA would otherwise record 'c', 'co' and
  // 'con' as three terms and bury the one the user actually meant. Both ways out of the panel
  // report - the abandoned search is the interesting half, since a term that matched nothing is
  // either a tool that doesn't exist or one named something nobody guesses.
  const trackSearch = (term, resultsCount) => {
    const searchTerm = term.trim().toLowerCase().slice(0, 100);
    if (!searchTerm) return;
    trackEvent('view_search_results', { search_term: searchTerm, results_count: resultsCount });
  };

  // Closing keeps the results on screen while the panel fades out (no flash of the empty box); they clear
  // once it has gone (clearPanel, the dialog's onExited).
  const reset = () => setSearchOpen(false);
  const clearPanel = () => {
    setSearchTerm('');
    setSelectedIndex(-1);
    setShowAllBreakdowns(false);
    setShowAllPins(false);
    setShowAllWiki(false);
  };
  // Every way out but opening a result: Esc, Cancel, a click outside. One event per search.
  const closePanel = () => {
    trackSearch(searchTerm, count);
    reset();
    leavePanelEntry();
  };
  useEffect(() => {
    closeOnBack.current = closePanel;
  });

  const handleNavigate = (href, filter) => {
    // A characters page section that is filtered out never mounts its breakdown. Turned on for this
    // visit only: the player's saved chips stay as they were
    if (filter && !shownFilters(state)?.[filter]) {
      startTransition(() => dispatch({ type: 'searchFilters', data: { ...state?.searchFilters, [filter]: true } }));
    }
    // ...and with no character picked there is nothing to open, so show the first one
    if (filter && !Object.values(shownCharacters(state)).some(Boolean)) {
      startTransition(() => dispatch({ type: 'displayedCharacters', data: { ...state?.displayedCharacters, 0: true } }));
    }
    trackSearch(searchTerm, count);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'search_result_clicked', {
        event_category: 'engagement',
        event_label: href.pathname,
        value: 1
      });
    }
    const target = { pathname: href.pathname, query: { ...updateQuery, ...href.query } };
    // A result for the page on screen only steps off the panel's entry: replacing it with the same URL would leave
    // two entries for one page, and the first Back would seem to do nothing.
    if (panelEntry.current === 'open' && sameUrl(hrefOf(target), router.asPath)) {
      reset();
      leavePanelEntry();
      return;
    }
    // The result takes the panel's history entry, so its Back goes straight to the page the search started on
    const replacesEntry = panelEntry.current === 'open';
    panelEntry.current = null;
    (replacesEntry ? router.replace : router.push)(target);
    reset();
  };

  const hrefFor = (href) => hrefOf({ pathname: href.pathname, query: { ...updateQuery, ...href.query } });
  // A plain click goes through the router (and keeps the session query); a modified one is the browser's.
  const onOpen = (row, href) => (event) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    handleNavigate(href, row.filter);
  };

  const handleKeyDown = (e) => {
    if (targets.length === 0) return;
    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev < targets.length - 1 ? prev + 1 : prev));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      e.preventDefault();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      // The panel closes and hands the focus back to the trigger: left alone, this Enter would press it too
      e.preventDefault();
      const target = targets[selectedIndex];
      if (target.more) target.more.open();
      else handleNavigate(target.row.href, target.row.filter);
    }
  };

  // The selected row stays in view as the arrows move past the visible ones.
  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSearchOpen = () => {
    setSearchOpen(true);
    if (isSm && !panelEntry.current) {
      window.history.pushState({ quickSearch: true }, '');
      panelEntry.current = 'open';
    }
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'search_opened', {
        event_category: 'engagement',
        event_label: 'quick_search',
        value: 1
      });
    }
  };

  // MUI's own Esc closes the open panel; a second handler here would report the search twice.
  useHotkeys([
    ['mod+K', () => {
      if (!searchOpen) {
        handleSearchOpen();
      } else {
        inputRef?.current?.focus?.();
      }
    }]
  ]);

  return <>
    {/* The trigger: the pill and the icon box, now a button (Search board, "the triggers"). Both looks are in
        the markup and CSS picks one, so nothing reflows after hydration. One name at every size; the shortcut
        is announced through aria-keyshortcuts. */}
    <ButtonBase onClick={handleSearchOpen} aria-label="Search" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K"
                sx={{
                  flexShrink: 0, height: 32, border: 1, borderColor: 'outline', borderRadius: '16px',
                  // 44 px to tap, the app bar's other buttons' size on a touch screen
                  '@media (pointer: coarse)': { height: 44, minWidth: 44 },
                  padding: '4px 12px',
                  '@media (max-width: 1365px)': { borderRadius: '8px', padding: '4px 8px' }
                }}>
      <IconSearch color={'var(--mui-palette-text-secondary)'} size={16}/>
      <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', height: '100%', '@media (max-width: 1365px)': { display: 'none' } }}>
        <Divider orientation={'vertical'} sx={{ mx: 1, bgcolor: 'divider', height: '80%' }}/>
        <Typography sx={{ lineHeight: '11px' }} variant={'caption'} color={'text.secondary'}>Ctrl + K</Typography>
      </Box>
    </ButtonBase>
    <Dialog onKeyDown={handleKeyDown}
            scroll={'paper'}
            fullWidth
            maxWidth={'sm'}
            fullScreen={isSm}
            // The panel hugs what it shows, so it hangs from a fixed top: centred, it would jump with every letter typed
            sx={{ '& .MuiDialog-container': { alignItems: { sm: 'flex-start' } } }}
            slotProps={{
              paper: {
                'aria-label': 'Search',
                sx: isSm ? { borderRadius: 0, border: 0 } : { mt: '12vh', maxHeight: 'calc(100% - 12vh - 32px)' }
              }
            }}
            open={searchOpen}
            onClose={closePanel}
            TransitionProps={{ onExited: clearPanel }}>
      <DialogTitle component="div" sx={{ p: 0 }}>
        <Stack direction="row" alignItems="center" sx={{ pl: 0.5, pr: { xs: 1, sm: 2 }, minHeight: 56 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            autoFocus
            placeholder={'Search pages, stats and items'}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowAllBreakdowns(false);
              setShowAllWiki(false);
              // A search picks its first row, so Enter right after typing opens it; a new search starts at the top
              setSelectedIndex(e.target.value.trim() ? 0 : -1);
              if (listRef.current) listRef.current.scrollTop = 0;
            }}
            sx={{
              [`.${inputBaseClasses.root} fieldset`]: {
                border: 'none',
                height: 0
              },
              [`.${inputBaseClasses.root}`]: { fontSize: 16 },
              [`.${inputBaseClasses.input}`]: {
                paddingLeft: '8px'
              }
            }}
            slotProps={{
              htmlInput: { 'aria-label': 'Search' },
              input: { startAdornment: <IconSearch color={'var(--mui-palette-text-secondary)'}/> }
            }}
          />
          <Kbd aria-hidden sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Esc</Kbd>
          <Button onClick={closePanel} sx={{ display: { xs: 'inline-flex', sm: 'none' }, flexShrink: 0 }}>Cancel</Button>
        </Stack>
        <Divider/>
      </DialogTitle>
      {/* Full screen on a phone: the list ends clear of the safe area and, until it is answered, the consent banner */}
      <DialogContent ref={listRef} sx={{
        maxHeight: { sm: 450 }, px: 0, pt: 0, pb: { xs: 'calc(env(safe-area-inset-bottom) + var(--consent-banner-height, 0px))', sm: 0 }
      }}>
        {/* A typo still lands (Search board, "Forgiving"): the closest rows, and what the search was read as. */}
        {term && closeTo ? <Typography role="status" color="text.secondary" sx={{ px: 2, pt: '10px', fontSize: 13 }}>
          {`No exact match. Showing the closest: ${closeTo}`}
        </Typography> : null}
        {groups.map((group) => (
          <Box key={group.key} sx={{ pt: 1, pb: 0.5 }}>
            <GroupTitle icon={group.icon}>{group.title}</GroupTitle>
            <Box component="ul" sx={{ p: 0, m: 0 }}>
              {group.rows.map((row) => <ResultRow key={row.key} row={row} selected={indexOf.get(row.key) === selectedIndex}
                                                  onOpen={onOpen} hrefFor={hrefFor}/>)}
              {group.more ? <Box component="li" data-selected={indexOf.get(`more:${group.key}`) === selectedIndex || undefined}
                                 sx={{ ...ROW_SX(indexOf.get(`more:${group.key}`) === selectedIndex), minHeight: { xs: 44, sm: 36 }, px: 0, py: 0 }}>
                {/* The focus goes back to the field, so typing and the arrows carry on after the list grows */}
                <Button size="small" sx={{ ml: 7, ...touchTarget }} onClick={() => {
                  group.more.open();
                  inputRef.current?.focus();
                }}>{group.more.label}</Button>
              </Box> : null}
              {group.note ? <Typography component="li" variant="caption" color="text.secondary" sx={{ listStyle: 'none', display: 'block', pl: 7.5, pb: 1 }}>
                {group.note}
              </Typography> : null}
            </Box>
          </Box>
        ))}
        {/* The wiki group's place while its index loads (the first open only, a moment). */}
        {wikiLoading ? <Box sx={{ pt: 1, pb: 0.5 }}>
          <GroupTitle>Wiki</GroupTitle>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 1 }}>Loading the wiki</Typography>
        </Box> : null}
        {/* A search that matches nothing says so, with the step that brings the rows back (the breakdown's way) */}
        {!groups.length && !wikiLoading && term ? (
          <Notice sx={{ px: 2, py: 2 }} focusAfter={() => inputRef.current}
                  action={{
                    label: 'Clear search', onClick: () => {
                      setSearchTerm('');
                      setSelectedIndex(-1);
                    }
                  }}>
            {`Nothing matches “${term}”.`}
          </Notice>
        ) : null}
        {!groups.length && !wikiLoading && !term ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <Typography color="text.secondary">Pages you pin or visit show here</Typography>
          </Box>
        ) : null}
      </DialogContent>
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2, px: 2, py: '10px', borderTop: 1, borderColor: 'divider', fontSize: 12, color: 'text.secondary' }}>
        <KeyHint keys={['↑', '↓']}>move</KeyHint>
        <KeyHint keys={['Enter']}>open</KeyHint>
        <KeyHint keys={['Esc']}>close</KeyHint>
      </Box>
    </Dialog>
  </>;
};

export default QuickSearch;
