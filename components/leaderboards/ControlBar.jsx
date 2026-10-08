import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, FormControlLabel, IconButton, InputAdornment, Popover, Stack, Switch, TextField, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { IconDotsVertical, IconListSearch, IconSearch, IconX } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import useHydrated from '@hooks/useHydrated';
import useFormatDate from '@hooks/useFormatDate';
import useProfileBannerState from '@hooks/useProfileBannerState';
import { navBarHeight, profileBannerHeight } from '@components/constants';
import { numberWithCommas } from '@utility/helpers';
import { searchNames } from '../../services/leaderboards';
import { AGGREGATION_INTERVAL, FOCUS_RING, GLOBAL_METRIC, rankText } from './format';
import { HIGHLIGHT } from './RankRow';

const MIN_QUERY = 2;
const FIELD_OUTLINE = 'rgba(255,255,255,0.23)';
const fieldHeight = { xs: 44, sm: 40 };

// Rows that say something instead of offering a player: Enter or a click on them does nothing, so the
// typed text stays put.
const NO_MATCH = { message: 'noMatch', mainChar: '' };
const ANON_HINT = { message: 'anon', mainChar: '' };
const ANON_PREFIX = /^anon#/i;
const ANON_ID = /^anon#[0-9a-f]{6}$/i;
const optionLabel = (option) => (typeof option === 'string' ? option : option.mainChar);

// The names API matches by prefix, so a list kept from the previous query is cut to what still
// matches; an exact name goes first, which is what Enter picks.
const matchesFor = (options, input) => {
  const query = input.trim().toLowerCase();
  return options
    .filter((option) => option.mainChar.toLowerCase().startsWith(query))
    .sort((a, b) => Number(b.mainChar.toLowerCase() === query) - Number(a.mainChar.toLowerCase() === query));
};

// Matched prefix in bold, rank on the right when the names API sends one.
const PlayerOption = ({ name, rank, query }) => {
  const matched = name.toLowerCase().startsWith(query.toLowerCase()) ? query.length : 0;
  return (
    <Stack direction="row" alignItems="center" gap={1.25} sx={{ width: '100%' }}>
      <Box component="span" sx={{ flexGrow: 1, minWidth: 0 }}>
        <b>{name.slice(0, matched)}</b>{name.slice(matched)}
      </Box>
      {rank != null ? <Typography component="span" sx={{ fontSize: 12, color: 'text.disabled', flexShrink: 0 }}>{rankText(rank)}</Typography> : null}
    </Stack>
  );
};

const isTouch = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: none)').matches);

// The field holds the viewed player: their name sits in it, outlined in their highlight colour, and
// its X stops viewing them. Typing over the name searches for someone else; leaving the field with a
// half-typed name puts the viewed one back.
const PlayerSearch = ({ onPlayer, viewing = null, onClear }) => {
  const viewingName = viewing?.name ?? '';
  const [input, setInput] = useState(viewingName);
  // A new viewed player (or none) replaces whatever the field held.
  const [shownFor, setShownFor] = useState(viewingName);
  if (viewingName !== shownFor) {
    setShownFor(viewingName);
    setInput(viewingName);
  }
  const inputRef = useRef(null);
  const picking = useRef(false);
  // Set by the press that is about to focus the field, so only that click selects the name and a
  // later click can still place the caret inside it.
  const pointerFocus = useRef(false);
  const text = input.trim();
  const typing = Boolean(text) && input !== viewingName;
  const [debounced] = useDebouncedValue(typing ? text : '', 250);
  // Anon# ids are left out of the name search by design.
  const ready = debounced.length >= MIN_QUERY && !ANON_PREFIX.test(debounced);
  const { data: players = [], isFetching } = useQuery({
    queryKey: ['lb-names', debounced.toLowerCase()],
    queryFn: () => searchNames(debounced),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData
  });
  const showsViewed = Boolean(viewingName) && input === viewingName;

  // Stops viewing when the field shows the viewed player or was emptied over them; otherwise it only
  // clears the typed text. A touch screen keeps its keyboard down after stopping.
  const stopsViewing = Boolean(viewingName) && (showsViewed || !input);
  const clear = () => {
    if (stopsViewing) onClear?.();
    else setInput('');
    if (!(stopsViewing && isTouch())) inputRef.current?.focus();
  };

  return (
    <Autocomplete
      freeSolo
      size="small"
      disableClearable
      options={ready ? players : []}
      getOptionLabel={optionLabel}
      // Enter picks the highlighted suggestion: typing "gearp" and pressing Enter finds gearperson.
      autoHighlight
      // Message rows are not choices: Enter goes past them to the typed text, which the page answers
      // with "No player named ...", instead of a first Enter that does nothing.
      getOptionDisabled={(option) => Boolean(option.message)}
      filterOptions={(options, { inputValue }) => {
        const query = inputValue.trim();
        if (!typing) return [];
        // A full Anon# id is searched as typed on Enter; a partial one says what is missing.
        if (ANON_PREFIX.test(query)) return ANON_ID.test(query) ? [] : [ANON_HINT];
        const matches = matchesFor(options, query);
        const settled = ready && !isFetching && debounced === query;
        return matches.length || !settled ? matches : [NO_MATCH];
      }}
      value={null}
      inputValue={input}
      // Only typing changes the text: a pick sets it in onChange, and a message row must not blank it.
      onInputChange={(event, value, reason) => { if (reason === 'input' || reason === 'clear') setInput(value); }}
      // freeSolo: Enter on free text arrives as 'createOption', which is how Anon# ids get searched.
      // A miss keeps the typed text, so a typo is one key away from fixed.
      onChange={(event, value, reason) => {
        if (value?.message) return;
        const name = value == null ? '' : optionLabel(value).trim();
        if (!name || name === viewingName) return;
        if (reason === 'selectOption') setInput(name);
        picking.current = true;
        onPlayer(name, reason === 'selectOption' ? 'typeahead' : 'enter');
        // A touch keyboard drops out of the way of a player picked from the list; typed text may be a
        // miss, so the field stays ready for a fix. A keyboard user stays here either way.
        if (reason === 'selectOption' && isTouch()) inputRef.current?.blur();
        picking.current = false;
      }}
      // Typing replaces the viewed name rather than appending to it. Keyboard focus selects here; a
      // click selects on its own click event (below), since its mouseup would drop a selection made now.
      onFocus={(event) => { if (showsViewed && !pointerFocus.current) event.target.select?.(); }}
      onBlur={() => { if (!picking.current && viewingName && input !== viewingName) setInput(viewingName); }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        if (option.message) {
          return <Box component="li" key={option.message} {...optionProps} sx={{ cursor: 'default !important', opacity: '1 !important' }}>
            <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>
              {option.message === 'anon' ? 'Type the full Anon# id (Anon# and 6 characters), then search' : `No players start with "${debounced}"`}
            </Typography>
          </Box>;
        }
        return (
          <li key={key} {...optionProps} aria-label={option.rank != null ? `${option.mainChar}, rank ${option.rank}` : option.mainChar}>
            <PlayerOption name={option.mainChar} rank={option.rank} query={debounced}/>
          </li>
        );
      }}
      slotProps={{
        // MUI drops the highlight on touch screens, which hid the row Enter would pick.
        paper: { sx: { '& .MuiAutocomplete-listbox .MuiAutocomplete-option.Mui-focused': { bgcolor: 'action.hover' } } },
        listbox: { 'aria-label': 'Player suggestions' }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder="Find a player or Anon# id"
          slotProps={{
            htmlInput: {
              ...params.inputProps, 'aria-label': 'Find a player',
              enterKeyHint: 'search', autoCorrect: 'off', autoCapitalize: 'none', spellCheck: false,
              onMouseDown: (event) => {
                params.inputProps.onMouseDown?.(event);
                pointerFocus.current = document.activeElement !== event.currentTarget;
              },
              onClick: (event) => {
                params.inputProps.onClick?.(event);
                if (pointerFocus.current && showsViewed) event.currentTarget.select();
                pointerFocus.current = false;
              },
              // Escape puts the viewed player back after typing over them.
              onKeyDown: (event) => {
                params.inputProps.onKeyDown?.(event);
                if (event.key === 'Escape' && viewingName && input !== viewingName) setInput(viewingName);
              }
            },
            input: {
              ...params.InputProps,
              startAdornment: <InputAdornment position="start" sx={{ color: 'text.secondary' }}><IconSearch size={16}/></InputAdornment>,
              // Shown while anything is typed, and always while a player is viewed: an emptied field
              // must still offer the way out.
              endAdornment: input || viewingName ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clear} aria-label={stopsViewing ? `Stop viewing ${viewingName}` : 'Clear search'}
                              sx={{ width: { xs: 40, sm: 28 }, height: { xs: 40, sm: 28 }, color: 'text.secondary', mr: { xs: -1, sm: -0.5 } }}>
                    <IconX size={16}/>
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          }}
        />
      )}
      sx={{
        flex: '1 1 240px', minWidth: 200, maxWidth: { xs: 'none', sm: 360 },
        '& .MuiOutlinedInput-root': { height: fieldHeight, py: 0, pr: '8px !important' },
        ...(showsViewed ? {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: `${HIGHLIGHT[viewing.kind]} !important` },
          '& .MuiInputBase-input': { fontWeight: 600 }
        } : {})
      }}
    />
  );
};

const CATEGORY_LABEL = (category) => category.charAt(0).toUpperCase() + category.slice(1);

// Every typed word must appear in the board's name or its section, in any order: "colosseum w5"
// finds W5 Colosseum and "bosses" finds the Kills & Bosses boards.
const filterBoards = (options, { inputValue }) => {
  const words = inputValue.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return options;
  return options.filter((option) => {
    const text = `${option.label} ${option.section ?? ''}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
};

const KeyHint = () => (
  <InputAdornment position="end">
    <Box aria-hidden component="span" sx={{
      fontSize: 11, color: 'text.disabled', border: `1px solid ${FIELD_OUTLINE}`, borderRadius: '4px', px: 0.75, lineHeight: '16px',
      // No keyboard shortcut to hint at on a touch screen.
      '@media (hover: none)': { display: 'none' }
    }}>/</Box>
  </InputAdornment>
);

// fullWidth: the phone menu stacks its fields, where a flex basis would turn into a 220px tall gap.
const MetricJump = ({ index, onMetric, inputRef = null, showKeyHint = false, fullWidth = false }) => {
  const options = Object.values(index.byKey).filter((meta) => meta.category && meta.key !== GLOBAL_METRIC);
  return (
    <Autocomplete
      size="small"
      options={options}
      groupBy={(option) => CATEGORY_LABEL(option.category)}
      getOptionLabel={(option) => option.label}
      filterOptions={filterBoards}
      // Enter opens the first match without an arrow key first.
      autoHighlight
      value={null}
      blurOnSelect
      forcePopupIcon={false}
      disableClearable
      onChange={(event, option) => option && onMetric(option.key)}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder={`Jump to a board (${options.length})`}
          slotProps={{
            htmlInput: { ...params.inputProps, 'aria-label': 'Jump to board', enterKeyHint: 'go', autoCorrect: 'off', autoCapitalize: 'none', spellCheck: false },
            input: {
              ...params.InputProps,
              startAdornment: <InputAdornment position="start" sx={{ color: 'text.secondary' }}><IconListSearch size={16}/></InputAdornment>,
              endAdornment: showKeyHint ? <KeyHint/> : null
            }
          }}
        />
      )}
      sx={{
        ...(fullWidth ? { width: '100%' } : { flex: '1 1 220px', minWidth: 200, maxWidth: { xs: 'none', sm: 320 } }),
        '& .MuiOutlinedInput-root': { height: fieldHeight, py: 0, pr: 1.5 }
      }}
    />
  );
};

// Sits at the right end of the tab strip on desktop and in the phone menu. Times are the visitor's
// clock, so nothing renders until hydration.
export const LeaderboardStatus = ({ totalPlayers, createdAt }) => {
  const hydrated = useHydrated();
  const formatDate = useFormatDate();
  if (!hydrated || !createdAt) return null;
  return (
    <Typography variant="caption" sx={{ fontSize: 12, color: 'text.disabled', whiteSpace: 'nowrap' }}>
      {`${totalPlayers ? `${numberWithCommas(totalPlayers)} players · ` : ''}updated ${formatDate(createdAt, { timeOnly: true, showSeconds: false })} · next ~${formatDate(createdAt + AGGREGATION_INTERVAL, { timeOnly: true, showSeconds: false })}`}
    </Typography>
  );
};

// onStickyBottom: where the bar ends on screen, so the tab strip can pin right under it.
// viewing: the ?player= context ({ name, kind }), held by the search field, which clears it.
const ControlBar = ({ index, totalPlayers, createdAt, showAnonymous, onToggleAnonymous, onPlayer, onMetric, onStickyBottom, viewing, onClearPlayer, children }) => {
  const { isVisible: showProfileBanner } = useProfileBannerState();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [barHeight, setBarHeight] = useState(0);
  const jumpRef = useRef(null);
  const barRef = useRef(null);
  const top = navBarHeight + (showProfileBanner ? profileBannerHeight : 0);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (barHeight) onStickyBottom?.(top + barHeight);
  }, [top, barHeight]);

  // "/" focuses the board jump, registered on this page only and ignored while typing.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      // Only somewhere text can be typed keeps the key; the switch's checkbox does not.
      if (event.target?.closest?.('input:not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]')) return;
      const jump = jumpRef.current;
      if (!jump) return;
      jump.focus();
      // On a phone the desktop jump is display:none and cannot take focus; leave the key alone then.
      if (document.activeElement === jump) event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const anonSwitch = (
    <FormControlLabel
      control={<Switch checked={showAnonymous} onChange={onToggleAnonymous} inputProps={{ role: 'switch' }}
                       // Its input is invisible, so the ring goes on the switch itself.
                       sx={{ borderRadius: 2, '&:has(.Mui-focusVisible)': { outline: '2px solid #90caf9', outlineOffset: '-4px' } }}/>}
      label="Show anonymous"
      slotProps={{ typography: { sx: { fontSize: 13, color: 'text.secondary' } } }}
      sx={{ minHeight: fieldHeight, my: 0 }}
    />
  );

  return (
    <Box ref={barRef} sx={{
      position: 'sticky', top, zIndex: (theme) => theme.zIndex.appBar - 1,
      // No line of its own: the tab strip right under it closes the header with one line, so the
      // tabs sit centred between the fields and that line.
      bgcolor: 'background.default', py: 1.5,
      // A landscape phone has no height to spare for pinned bars.
      '@media (max-height: 500px)': { position: 'static' }
    }}>
      <Stack direction="row" gap={{ xs: 1, sm: 2 }} alignItems="flex-start" flexWrap={{ xs: 'nowrap', sm: 'wrap' }}>
        <PlayerSearch onPlayer={onPlayer} viewing={viewing} onClear={onClearPlayer}/>
        {/* Both layouts are in the markup and CSS picks one, so a phone does not reflow after hydration. */}
        <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>
          <MetricJump index={index} onMetric={onMetric} inputRef={jumpRef} showKeyHint/>
          {anonSwitch}
          {children}
          <Box sx={{ flexGrow: 1 }}/>
          <Box sx={{ display: { xs: 'none', sm: 'flex', xl: 'none' }, alignItems: 'center', minHeight: fieldHeight }}>
            <LeaderboardStatus totalPlayers={totalPlayers} createdAt={createdAt}/>
          </Box>
        </Box>
        <IconButton
          aria-label="More options"
          aria-haspopup="dialog"
          aria-expanded={Boolean(menuAnchor)}
          aria-controls={menuAnchor ? 'lb-more-options' : undefined}
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={{ display: { xs: 'inline-flex', sm: 'none' }, width: 44, height: 44, flexShrink: 0, bgcolor: 'rgba(255,255,255,0.08)', color: 'common.white' }}>
          <IconDotsVertical size={18}/>
        </IconButton>
      </Stack>
      <Popover
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { id: 'lb-more-options', role: 'dialog', 'aria-label': 'More options', sx: FOCUS_RING } }}>
        <Stack gap={1.5} sx={{ p: 2, width: 300 }}>
          <MetricJump fullWidth index={index} onMetric={(key) => { setMenuAnchor(null); onMetric(key); }}/>
          {anonSwitch}
          {children}
          <LeaderboardStatus totalPlayers={totalPlayers} createdAt={createdAt}/>
        </Stack>
      </Popover>
    </Box>
  );
};

export default ControlBar;
