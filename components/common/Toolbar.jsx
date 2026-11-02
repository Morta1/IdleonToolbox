import React, { Children, createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  Typography
} from '@mui/material';
import { IconAdjustmentsHorizontal, IconArrowDown, IconArrowUp, IconCheck, IconSearch, IconX } from '@tabler/icons-react';
import usePageTop from '@hooks/usePageTop';
import Notice from '@components/common/Notice';
import { commaNotation } from '@utility/helpers';
import AppDialog from '@components/common/Overlays/AppDialog';
import ViewSwitch from '@components/common/ViewSwitch';
import { focusWithinRing } from '../../styles/theme/darkTheme';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// What the slots read: the page's state and defaults, the change callback (a patch), and whether the slot
// sits in the bar ('row') or in the phone panel ('panel').
const ToolbarContext = createContext({ state: {}, defaults: {}, onChange: () => {}, placement: 'row' });

// The muted word before a select's value: "Show World 3", "Sort: Cost".
const prefixed = (prefix, label) => <>
  <Box component="span" sx={{ color: 'text.secondary', mr: 0.75 }}>{prefix}</Box>
  {label}
</>;

// Always in the row, on a phone too: a page's own lead control (the leaderboards' player search).
const Lead = ({ children }) => children;

// A page's own phone panel, as a function of close (the leaderboards' extras). Renders nothing in place.
const Panel = () => null;

// Row only: it stays visible on a phone, where it takes the row's free width. Clear search puts the focus back in
// the field: the x unmounts as the value empties, which would drop it to the page.
const Search = ({ name = 'search', placeholder }) => {
  const { state, onChange } = useContext(ToolbarContext);
  const inputRef = useRef(null);
  const value = state[name] ?? '';
  const clear = () => {
    onChange({ [name]: '' });
    inputRef.current?.focus();
  };
  return <TextField
    inputRef={inputRef}
    value={value}
    onChange={(event) => onChange({ [name]: event.target.value })}
    placeholder={placeholder}
    sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' }, width: { sm: 260 }, minWidth: 0 }}
    slotProps={{
      htmlInput: { 'aria-label': placeholder, enterKeyHint: 'search', spellCheck: false },
      input: {
        startAdornment: <InputAdornment position="start" sx={{ color: 'text.secondary' }}><IconSearch size={16}/></InputAdornment>,
        endAdornment: value ? <InputAdornment position="end">
          <IconButton size="small" aria-label="Clear search" onClick={clear}
                      sx={{ mr: -0.5, color: 'text.secondary' }}>
            <IconX size={16}/>
          </IconButton>
        </InputAdornment> : null
      }
    }}
  />;
};

// Which set of rows to show, each option with its count: [value, label, count].
const Show = ({ name = 'show', options }) => {
  const { state, onChange, placement } = useContext(ToolbarContext);
  const labelOf = (value) => options.find(([key]) => key === value)?.[1] ?? '';
  return <TextField
    select
    value={state[name] ?? ''}
    onChange={(event) => onChange({ [name]: event.target.value })}
    sx={placement === 'panel' ? { width: '100%' } : { minWidth: 200 }}
    slotProps={{
      select: {
        displayEmpty: true,
        renderValue: (value) => prefixed('Show', labelOf(value)),
        SelectDisplayProps: { 'aria-label': 'Show' }
      }
    }}
  >
    {options.map(([key, label, count]) => <MenuItem key={key} value={key}>
      {count == null ? label : `${label} (${commaNotation(count)})`}
    </MenuItem>)}
  </TextField>;
};

// An on/off filter, a pill you press.
const Filter = ({ name, label }) => {
  const { state, onChange } = useContext(ToolbarContext);
  const on = Boolean(state[name]);
  return <ToggleButton
    value={name}
    selected={on}
    onChange={() => onChange({ [name]: !on })}
    sx={{
      borderRadius: 999, px: 2, gap: 0.75, whiteSpace: 'nowrap',
      '&.Mui-selected, &.Mui-selected:hover': { color: 'primary.main', bgcolor: 'primary.soft', borderColor: 'primary.edge' }
    }}
  >
    {on ? <IconCheck size={16}/> : null}
    {label}
  </ToggleButton>;
};

// The sort without the headers: options are [key, label, firstOrder?]. The direction button is the only way a
// phone, whose headers are hidden, flips a sort.
const Sort = ({ name = 'sort', options, sx }) => {
  const { state, onChange, placement } = useContext(ToolbarContext);
  const sort = state[name] ?? null;
  const descending = sort?.order === 'desc';
  const labelOf = (key) => options.find(([value]) => value === key)?.[1] ?? key;
  return <Stack direction="row" gap={0.5} alignItems="center" sx={{ ...(placement === 'panel' ? { width: '100%' } : {}), ...sx }}>
    <TextField
      select
      value={sort?.key ?? ''}
      onChange={(event) => {
        const option = options.find(([key]) => key === event.target.value);
        onChange({ [name]: option ? { key: option[0], order: option[2] ?? 'desc' } : null });
      }}
      sx={placement === 'panel' ? { flex: 1 } : { minWidth: 180 }}
      slotProps={{
        select: {
          displayEmpty: true,
          renderValue: (key) => prefixed('Sort:', key ? labelOf(key) : 'Default'),
          SelectDisplayProps: { 'aria-label': 'Sort by' }
        }
      }}
    >
      <MenuItem value="">Default</MenuItem>
      {options.map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
    </TextField>
    <IconButton
      aria-label={descending ? 'Descending' : 'Ascending'}
      disabled={!sort}
      // sort?.key, not sort.key: React Compiler reads a closure's property paths during render, and the
      // button is disabled (sort null) until a sort is picked.
      onClick={() => onChange({ [name]: { key: sort?.key, order: descending ? 'asc' : 'desc' } })}
      sx={{ width: 40, height: 40 }}
    >
      {descending ? <IconArrowDown size={18}/> : <IconArrowUp size={18}/>}
    </IconButton>
  </Stack>;
};

// Row only, next to the phone button. 40 px, a toolbar's size.
const View = ({ name = 'view', options = [['cards', 'Cards'], ['table', 'Table']] }) => {
  const { state, onChange } = useContext(ToolbarContext);
  return <ViewSwitch size="medium" options={options} value={state[name]} onChange={(value) => onChange({ [name]: value })}/>;
};

// The state key a slot reads.
const slotKey = (child) => {
  if (child.type === Search) return child.props.name ?? 'search';
  if (child.type === Show) return child.props.name ?? 'show';
  if (child.type === Sort) return child.props.name ?? 'sort';
  return child.props.name;
};

// "A search is on.", "1 filter is on.", "2 filters and a search are on."
const onSentence = (filters, search) => {
  const subject = [filters ? `${filters} filter${filters === 1 ? '' : 's'}` : null, search ? 'a search' : null]
    .filter(Boolean).join(' and ');
  return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} ${filters > 1 || (filters && search) ? 'are' : 'is'} on.`;
};

// One row of controls for a list page (Toolbar board), grown from the leaderboards ControlBar. Sticky under
// the nav bar, and under the profile banner when it shows, within its parent: a page puts the toolbar and
// the content it controls in one box, so both leave together at the content's end. On a phone everything
// but the lead, the search and the view goes behind one button.
// Slots (direct children, any order): Search, Lead, Show, Filter, Sort, View, Panel. `state` and `defaults`
// hold their values by name; `sort` is null or { key, order }, the value DataTable's header reports. A
// Search, Show or Filter away from its default narrows the list, which brings the result line.
// onStickyBottom: where the bar ends on screen, so a tab strip or a table header can pin right under it.
// panelTall: the phone panel holds a list that opens below its field (the leaderboards' Jump to a board), so
// its sheet keeps 85% of the window and the list has room under the field.
// note: a Notice shown in the bar, about what the bar just did (a player search that found no one).
const Toolbar = ({
  onStickyBottom, panelLabel = 'Filters', panelIcon = null, panelIconOnly = false, panelTall = false,
  state = {}, defaults = {}, onChange, onReset, total = 0, shown = 0, noun = 'results', note = null, children
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef(null);
  const panelId = useId();
  const top = usePageTop();

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

  const change = (patch) => onChange?.(patch);
  const items = Children.toArray(children);
  const ofType = (...types) => items.filter((child) => types.includes(child.type));
  const searches = ofType(Search);
  const shows = ofType(Show);
  const filters = ofType(Filter);
  const sorts = ofType(Sort);
  const panel = items.find((child) => child.type === Panel);
  const others = items.filter((child) => ![Search, Lead, Panel, Show, Filter, Sort, View].includes(child.type));
  // A phone row holding a search, a view and the panel button left the search a few letters wide: the search
  // takes its own line there, the view and the button the next.
  const searchOwnRow = searches.length > 0 && ofType(View).length > 0;
  const differs = (child) => !same(state[slotKey(child)], defaults[slotKey(child)]);

  // The panel's count: every Show, Filter and Sort away from its default.
  const panelSlots = [...shows, ...filters, ...sorts];
  const panelChanged = panelSlots.filter(differs);
  const hasPanel = Boolean(panel) || panelSlots.length > 0;
  const buttonLabel = panelChanged.length ? `${panelLabel} (${panelChanged.length})` : panelLabel;

  // What narrows the list, in the row's order. Each filter has its own way back here; a search is only named,
  // since its field's own x clears it.
  const narrowing = [
    ...searches.filter(differs).map((child) => ({ key: slotKey(child), text: `"${state[slotKey(child)]}"`, search: true })),
    ...shows.filter(differs).map((child) => {
      const label = child.props.options.find(([value]) => value === state[slotKey(child)])?.[1] ?? '';
      return { key: slotKey(child), text: label, label };
    }),
    ...filters.filter(differs).map((child) => ({ key: slotKey(child), text: child.props.label, label: child.props.label }))
  ];
  const filtersOn = shows.filter(differs).length + filters.filter(differs).length;
  const searchOn = searches.some(differs);

  const open = panelOpen;
  const close = () => setPanelOpen(false);
  const panelButton = {
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
    onClick: () => setPanelOpen(true)
  };
  // Resets only the panel's own controls; the search and the row stay as they are.
  const resetPanel = () => change(Object.fromEntries(panelChanged.map((child) => [slotKey(child), defaults[slotKey(child)]])));
  const phoneOnly = { display: { xs: 'inline-flex', sm: 'none' }, flexShrink: 0 };
  const row = { state, defaults, onChange: change, placement: 'row' };

  return <>
    <Box ref={barRef} sx={{
      // Under a tab strip that pins on a phone (Tabber sets --page-tabs-pinned there), as DataTable's sticky header does
      position: 'sticky', top: `calc(${top}px + var(--page-tabs-pinned, 0px))`, zIndex: (theme) => theme.zIndex.appBar - 1,
      bgcolor: 'background.default', py: 1.5,
      // A landscape phone has no height to spare for pinned bars.
      '@media (max-height: 500px)': { position: 'static' }
    }}>
      <ToolbarContext value={row}>
        <Stack direction="row" gap={{ xs: 1, sm: 2 }} alignItems="flex-start"
               flexWrap={{ xs: searchOwnRow ? 'wrap' : 'nowrap', sm: 'wrap' }}>
          {searchOwnRow
            ? <Box sx={{ display: 'flex', flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>{searches}</Box>
            : searches}
          {ofType(Lead)}
          {/* Both layouts are in the markup and CSS picks one, so a phone does not reflow after hydration. */}
          <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>{[...panelSlots, ...others]}</Box>
          {ofType(View)}
          {hasPanel ? (panelIconOnly
            ? <IconButton aria-label={buttonLabel} {...panelButton}
                          sx={{ ...phoneOnly, width: 44, height: 44, bgcolor: 'action.hover', color: 'common.white' }}>
              {panelIcon}
            </IconButton>
            : <Button variant="outlined" startIcon={panelIcon ?? <IconAdjustmentsHorizontal size={18}/>} {...panelButton}
                      sx={{ ...phoneOnly, whiteSpace: 'nowrap' }}>
              {buttonLabel}
            </Button>) : null}
        </Stack>
        {narrowing.length ? <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1.5 }}>
          {/* A line of its own on a phone, so Reset never wraps alone after the tokens. */}
          <Typography variant="body2" color="text.secondary" sx={{ flexBasis: { xs: '100%', sm: 'auto' } }}>
            {`Showing ${commaNotation(shown)} of ${commaNotation(total)}`}
          </Typography>
          {narrowing.map(({ key, text, label, search }) => search
            // The field's own x clears a search; here it is only named (Toolbar board: each active filter with an x)
            ? <Typography key={key} variant="body2">{text}</Typography>
            : <Button
              key={key}
              size="small"
              variant="outlined"
              aria-label={`Clear ${label}`}
              endIcon={<IconX size={14}/>}
              onClick={() => change({ [key]: defaults[key] })}
            >
              {text}
            </Button>)}
          {/* With nothing shown, the empty note's Reset is the one way back */}
          {shown > 0 ? <Button size="small" onClick={onReset}>Reset</Button> : null}
        </Stack> : null}
        {/* A message about what the bar just did (a search that found no one): in the bar, so it shows
            where the player is looking after a scroll. The empty-result note stays under the bar. */}
        {note ? <Box sx={{ mt: 1.5 }}>{note}</Box> : null}
      </ToolbarContext>
      {/* The phone panel (its button shows only on a phone): a bottom sheet, like every phone overlay,
          over the anchor ad while it is open. Changes apply at once; Done only closes. */}
      <AppDialog open={open} onClose={close} id={panelId} size="s" title={panelLabel} phone={panelTall ? 'tall' : 'sheet'}
                 actions={panel ? undefined : [
                   ...(panelChanged.length ? [{ label: 'Reset', onClick: resetPanel }] : []),
                   { label: 'Done', main: true }
                 ]}>
        <Box sx={focusWithinRing}>
          {panel ? panel.props.children(close) : <ToolbarContext value={{ ...row, placement: 'panel' }}>
            <Stack gap={1.5}>
              {shows}
              {filters.length ? <Stack direction="row" gap={1} flexWrap="wrap">{filters}</Stack> : null}
              {sorts}
            </Stack>
          </ToolbarContext>}
        </Box>
      </AppDialog>
    </Box>
    {/* An empty result is a note under the toolbar (Notices board). */}
    {shown === 0 && narrowing.length ? <Notice tone="info" action={{ label: 'Reset', onClick: onReset }}>
      {`No ${noun} match. ${onSentence(filtersOn, searchOn)}`}
    </Notice> : null}
  </>;
};

Toolbar.Lead = Lead;
Toolbar.Panel = Panel;
Toolbar.Search = Search;
Toolbar.Show = Show;
Toolbar.Filter = Filter;
Toolbar.Sort = Sort;
Toolbar.View = View;

export default Toolbar;
