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
  ListSubheader,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { startTransition, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { prefix } from '@utility/helpers';
import { trackEvent } from '@utility/analytics';
import { sessionQuery } from '@utility/nav-query';
import { searchToolbox } from '@utility/search/quickSearch';
import { AppContext, shownFilters } from '@components/common/context/AppProvider';
import EntityIcon from '@components/wiki/EntityIcon';
import { isModifiedClick } from '@components/wiki/links';

const hrefOf = ({ pathname, query }) => {
  const search = new URLSearchParams(query).toString();
  return search ? `${pathname}?${search}` : pathname;
};

const ROW_SX = (selected) => ({
  listStyle: 'none', position: 'relative', borderRadius: 1, mb: 0.5, px: 1, minHeight: { xs: 52, sm: 48 },
  display: 'flex', alignItems: 'center', gap: 1.5,
  bgcolor: selected ? 'action.selected' : 'transparent', '&:hover': { bgcolor: 'action.hover' }
});

// The row's main link stretches over the row; its tab links sit above that, so a tap on the row opens the
// page and a tap on a tab opens the tab. Real anchors: middle click and "open in new tab" work.
const ResultRow = ({ row, selected, onOpen, hrefFor }) => <Box component="li" data-selected={selected || undefined}
                                                               sx={ROW_SX(selected)}>
  <EntityIcon node={{ icon: row.icon ? `${prefix}${row.icon}.png` : null }} size={32}/>
  <Box sx={{ flex: 1, minWidth: 0, py: 0.75 }}>
    <Link href={hrefFor(row.href)} onClick={onOpen(row, row.href)} underline="none" color="text.primary"
          sx={{ display: 'block', fontWeight: 500, '&::after': { content: '""', position: 'absolute', inset: 0 } }}>
      {row.label}
    </Link>
    {row.note ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{row.note}</Typography> : null}
    {row.tabs?.length ? <Stack direction="row" columnGap={1.5} flexWrap="wrap" sx={{ position: 'relative', zIndex: 1 }}>
      {row.tabs.map((tab) => <Link key={tab.label} href={hrefFor(tab.href)} onClick={onOpen(row, tab.href)} variant="caption">
        {tab.label}
      </Link>)}
    </Stack> : null}
  </Box>
</Box>;

const QuickSearch = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAllBreakdowns, setShowAllBreakdowns] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  // Read only by the open panel, which never renders at build.
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const router = useRouter();
  const { state, dispatch } = useContext(AppContext);
  const updateQuery = sessionQuery(router?.query);

  const results = searchToolbox(searchTerm, { allBreakdowns: showAllBreakdowns });
  // What the arrow keys move through, in display order: each row, and each group's expander.
  const targets = results.groups.flatMap((group) => [
    ...group.rows.map((row) => ({ key: row.key, row })),
    ...(group.hidden ? [{ key: `more:${group.key}`, more: true }] : [])
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

  const reset = () => {
    setSearchOpen(false);
    setSearchTerm('');
    setSelectedIndex(-1);
    setShowAllBreakdowns(false);
  };
  // Every way out but opening a result: Esc, Cancel, a click outside. One event per search.
  const closePanel = () => {
    trackSearch(searchTerm, results.count);
    reset();
  };

  const handleNavigate = (href, filter) => {
    // A characters page section that is filtered out never mounts its breakdown. Turned on for this
    // visit only: the player's saved chips stay as they were
    if (filter && !shownFilters(state)?.[filter]) {
      startTransition(() => dispatch({ type: 'searchFilters', data: { ...state?.searchFilters, [filter]: true } }));
    }
    // ...and with no character picked there is nothing to open, so show the first one
    if (filter && !Object.values(state?.displayedCharacters ?? {}).some(Boolean)) {
      startTransition(() => dispatch({ type: 'displayedCharacters', data: { ...state?.displayedCharacters, 0: true } }));
    }
    trackSearch(searchTerm, results.count);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'search_result_clicked', {
        event_category: 'engagement',
        event_label: href.pathname,
        value: 1
      });
    }
    router.push({ pathname: href.pathname, query: { ...updateQuery, ...href.query } });
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
      const target = targets[selectedIndex];
      if (target.more) setShowAllBreakdowns(true);
      else handleNavigate(target.row.href, target.row.filter);
    }
  };

  // The selected row stays in view as the arrows move past the visible ones.
  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSearchOpen = () => {
    setSearchOpen(true);
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
                  flexShrink: 0, height: 32, border: '1px solid rgba(255, 255, 255, 0.23)', borderRadius: '16px',
                  padding: '4px 12px',
                  '@media (max-width: 1365px)': { borderRadius: '8px', padding: '4px 8px' }
                }}>
      <IconSearch stroke={'grey'} size={16}/>
      <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', height: '100%', '@media (max-width: 1365px)': { display: 'none' } }}>
        <Divider orientation={'vertical'} sx={{ mx: 1, bgcolor: 'grey', height: '80%' }}/>
        <Typography sx={{ lineHeight: '11px' }} variant={'caption'} color={'text.secondary'}>Ctrl + K</Typography>
      </Box>
    </ButtonBase>
    <Dialog onKeyDown={handleKeyDown}
            scroll={'paper'}
            fullWidth
            maxWidth={'sm'}
            fullScreen={isSm}
            slotProps={{ paper: { 'aria-label': 'Search', sx: isSm ? { borderRadius: 0, border: 0 } : undefined } }}
            open={searchOpen}
            onClose={closePanel}>
      <DialogTitle component="div" sx={{ p: 0 }}>
        <Stack direction="row" alignItems="center" sx={{ pr: { xs: 1, sm: 2 } }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            autoFocus
            placeholder={'Search pages and stats'}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowAllBreakdowns(false);
              setSelectedIndex(-1);
            }}
            sx={{
              [`.${inputBaseClasses.root} fieldset`]: {
                border: 'none',
                height: 0
              },
              [`.${inputBaseClasses.input}`]: {
                paddingLeft: '8px'
              }
            }}
            slotProps={{
              htmlInput: { 'aria-label': 'Search' },
              input: { startAdornment: <IconSearch stroke={'grey'}/> }
            }}
          />
          <Box component="kbd" aria-hidden sx={{
            display: { xs: 'none', sm: 'inline-flex' }, alignItems: 'center', px: 0.75, py: 0.25, border: 1,
            borderColor: 'divider', borderRadius: 1, typography: 'caption', color: 'text.secondary', fontFamily: 'inherit'
          }}>
            Esc
          </Box>
          <Button onClick={closePanel} sx={{ display: { xs: 'inline-flex', sm: 'none' }, flexShrink: 0 }}>Cancel</Button>
        </Stack>
        <Divider/>
      </DialogTitle>
      <DialogContent ref={listRef} sx={{ height: { sm: 450 }, px: 2, py: 0 }}>
        {results.groups.length > 0 ? results.groups.map((group) => (
          <Box key={group.key}>
            <ListSubheader component="div" disableSticky sx={{ background: 'none', lineHeight: '32px', px: 1 }}>
              {group.title}
            </ListSubheader>
            <Box component="ul" sx={{ p: 0, m: 0 }}>
              {group.rows.map((row) => <ResultRow key={row.key} row={row} selected={indexOf.get(row.key) === selectedIndex}
                                                  onOpen={onOpen} hrefFor={hrefFor}/>)}
              {group.hidden ? <Box component="li" data-selected={indexOf.get(`more:${group.key}`) === selectedIndex || undefined}
                                   sx={{ ...ROW_SX(indexOf.get(`more:${group.key}`) === selectedIndex), minHeight: { xs: 44, sm: 36 }, px: 0 }}>
                <Button size="small" onClick={() => setShowAllBreakdowns(true)} sx={{ ml: 5.5 }}>
                  {`Show ${group.hidden} more breakdowns`}
                </Button>
              </Box> : null}
            </Box>
          </Box>
        )) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
            <Typography color="text.secondary">
              {searchTerm.trim() ? `Nothing matches “${searchTerm.trim()}”` : 'Type to search pages, breakdowns and tools'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, px: 3, py: 1, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">↑ ↓ move · Enter open · Esc close</Typography>
      </Box>
    </Dialog>
  </>;
};

export default QuickSearch;
