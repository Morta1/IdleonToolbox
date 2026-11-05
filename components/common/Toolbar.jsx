import React, { Children, createContext, isValidElement, useContext, useEffect, useId, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
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
import { same } from '@hooks/useToolbarState';
import Notice from '@components/common/Notice';
import InfoButton from '@components/common/InfoButton';
import Tooltip from '@components/Tooltip';
import { commaNotation } from '@utility/helpers';
import AppDialog from '@components/common/Overlays/AppDialog';
import ViewSwitch from '@components/common/ViewSwitch';
import { focusWithinRing } from '../../styles/theme/darkTheme';

// What the slots read: the page's state and defaults, the change callback (a patch), and whether the slot
// sits in the bar ('row') or in the phone panel ('panel').
const ToolbarContext = createContext({ state: {}, defaults: {}, onChange: () => {}, placement: 'row' });

// The muted word before a select's value: "Show: World 3", "Sort: Cost".
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

// The Show and Filter looks for a control that sits outside a bar (a dialog's header, a drawer): the same field and pill,
// fed by their own value. The bar's Show and Filter render these.
// Which set of rows to show, each option with its count: [value, label, count, note]. label: what the field filters, where
// a Toolbar has several Show fields ("World", "Rank"): it takes "Show"'s place before the value and names the field.
// note: a line on what an option means. Its i sits beside the option in the list, and beside the field while that option
// is picked: the list's own keys never reach a button inside a row, so Tab finds it there.
export const ShowField = ({ value, onChange, label = 'Show', options, fullWidth }) => {
  const optionOf = (key) => options.find(([option]) => option === key);
  const counted = ([, label, count]) => (count == null ? label : `${label} (${commaNotation(count)})`);
  const picked = optionOf(value);
  const field = <TextField
    select
    value={value ?? ''}
    onChange={(event) => onChange(event.target.value)}
    sx={fullWidth ? { flex: 1, width: '100%' } : undefined}
    slotProps={{
      select: {
        displayEmpty: true,
        renderValue: (key) => prefixed(`${label}:`, optionOf(key) ? counted(optionOf(key)) : ''),
        SelectDisplayProps: { 'aria-label': label }
      }
    }}
  >
    {options.map((option) => <MenuItem key={option[0]} value={option[0]} sx={{ gap: 0.75 }}>
      {counted(option)}
      {option[3] ? <InfoButton label={option[1]}>{option[3]}</InfoButton> : null}
    </MenuItem>)}
  </TextField>;
  return picked?.[3] ? <Stack direction="row" alignItems="center" gap={0.75} sx={fullWidth ? { width: '100%' } : undefined}>
    {field}
    <InfoButton label={picked[1]}>{picked[3]}</InfoButton>
  </Stack> : field;
};

const Show = ({ name = 'show', label, options }) => {
  const { state, onChange, placement } = useContext(ToolbarContext);
  return <ShowField value={state[name]} onChange={(next) => onChange({ [name]: next })} label={label} options={options}
                    fullWidth={placement === 'panel'}/>;
};

// An on/off filter, a pill you press. Anything else (a ref, a drag's listeners, a key handler, sx) goes to the button.
// Off keeps the check's room as padding (25 px a side; on: 14, the 16 px check, 6, the text, 14), so a press moves nothing.
export const FilterPill = ({ value, on, label, onToggle, sx, children, ...rest }) => <ToggleButton
  {...rest}
  value={value ?? label}
  selected={Boolean(on)}
  onChange={onToggle}
  sx={[{
    borderRadius: 999, px: on ? '14px' : '25px', gap: 0.75, whiteSpace: 'nowrap', fontWeight: 400, color: 'text.primary', borderColor: 'outline',
    '&.Mui-selected, &.Mui-selected:hover': { color: 'primary.main', bgcolor: 'primary.soft', borderColor: 'primary.edge' }
  }, ...(Array.isArray(sx) ? sx : [sx])]}
>
  {children}
  {on ? <IconCheck size={16}/> : null}
  {label}
</ToggleButton>;

// display: the pill changes how the list reads, not which rows it holds ("Box details"), so the bar leaves it out of the
// result line. It still counts on the phone button. The bar reads it off the props.
const Filter = ({ name, label }) => {
  const { state, onChange } = useContext(ToolbarContext);
  const on = Boolean(state[name]);
  return <FilterPill value={name} on={on} label={label} onToggle={() => onChange({ [name]: !on })}/>;
};

// The sort without the headers: options are [key, label, firstOrder?, alphabetical?]. A click on a table's header flips its
// sort, but a card view and a phone have no header to click: there the direction button is the only way, so it stays, and it
// shows once a sort is picked rather than sitting faint and disabled. (The one Sort over a sortable table, the wiki's listing,
// hides below its headers' width.) alphabetical: its key is words, so the button says A to Z, not lowest first.
const Sort = ({ name = 'sort', options, sx }) => {
  const { state, onChange, placement } = useContext(ToolbarContext);
  const sort = state[name] ?? null;
  const descending = sort?.order === 'desc';
  const labelOf = (key) => options.find(([value]) => value === key)?.[1] ?? key;
  const [low, high] = options.find(([value]) => value === sort?.key)?.[3] ? ['A to Z', 'Z to A'] : ['Lowest first', 'Highest first'];
  const flip = `${descending ? high : low}, click to flip`;
  return <Stack direction="row" gap={0.5} alignItems="center" sx={{ ...(placement === 'panel' ? { width: '100%' } : {}), ...sx }}>
    <TextField
      select
      value={sort?.key ?? ''}
      onChange={(event) => {
        const option = options.find(([key]) => key === event.target.value);
        onChange({ [name]: option ? { key: option[0], order: option[2] ?? 'desc' } : null });
      }}
      sx={placement === 'panel' ? { flex: 1 } : undefined}
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
    {sort ? <Tooltip title={flip} disableTouchListener>
      <IconButton
        aria-label={flip}
        // sort?.key, not sort.key: React Compiler reads a closure's property paths during render.
        onClick={() => onChange({ [name]: { key: sort?.key, order: descending ? 'asc' : 'desc' } })}
        sx={{ width: 40, height: 40 }}
      >
        {descending ? <IconArrowDown size={18}/> : <IconArrowUp size={18}/>}
      </IconButton>
    </Tooltip> : null}
  </Stack>;
};

// ViewSwitch is for two or three ways to show a thing: more than that can't hold a phone's row, so it is a field there.
const MAX_SEGMENTS = 3;

// Row only, next to the phone button. 40 px, a toolbar's size.
const View = ({ name = 'view', options = [['cards', 'Cards'], ['table', 'Table']] }) => {
  const { state, onChange } = useContext(ToolbarContext);
  const pick = (value) => onChange({ [name]: value });
  const segments = <ViewSwitch size="medium" options={options} value={state[name]} onChange={pick}/>;
  if (options.length <= MAX_SEGMENTS) return segments;
  return <>
    <Box sx={{ display: { xs: 'flex', sm: 'none' }, flex: 1, minWidth: 0 }}>
      <ShowField label="View" value={state[name]} onChange={pick} options={options} fullWidth/>
    </Box>
    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{segments}</Box>
  </>;
};

const SLOTS = [Search, Lead, Panel, Show, Filter, Sort, View];

// A slot somewhere inside a child's own children, where the bar never looks.
const holdsSlot = (node) => (Array.isArray(node)
  ? node.some(holdsSlot)
  : isValidElement(node) && (SLOTS.includes(node.type) || holdsSlot(node.props?.children)));

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

// The result line's tokens and Reset (Toolbar board): 26 px drawn, with the 44 px tap target on a phone's coarse pointer.
const LINE_TAP = { position: 'relative', '@media (pointer: coarse)': { '&::before': { content: '""', position: 'absolute', inset: '-9px 0' } } };
const TOKEN_SX = {
  ...LINE_TAP, height: 26, gap: 0.5, pl: 1.25, pr: 0.75, borderRadius: 999, bgcolor: 'action.hover', color: 'text.primary', fontSize: 12.5, fontWeight: 400
};
const RESET_SX = { ...LINE_TAP, height: 26, ml: 0.5, px: 0.5, borderRadius: 1, color: 'primary.main', fontSize: 13, fontWeight: 500 };

// A group of the phone panel, under its caps label.
const PanelGroup = ({ label, children }) => <Stack gap={0.75}>
  <Typography variant="groupLabel" color="text.secondary">{label}</Typography>
  {children}
</Stack>;

// One row of controls for a list page (Toolbar board), grown from the leaderboards ControlBar. Sticky under
// the nav bar, and under the profile banner when it shows, within its parent: a page puts the toolbar and
// the content it controls in one box, so both leave together at the content's end. On a phone everything
// but the lead, the search and the view goes behind one button.
// Slots are read by type off the direct children only: one inside a fragment, a Box or a page's own component
// lands with the other children, never counted, named in the result line or put in the phone panel. Development
// warns for a wrapped slot it can see (not one a page component renders).
// Slots (direct children, any order): Search, Lead, Show, Filter, Sort, View, Panel. `state` and `defaults`
// hold their values by name; `sort` is null or { key, order }, the value DataTable's header reports. A
// Search, Show or Filter away from its default narrows the list, which brings the result line.
// onStickyBottom: where the bar ends on screen, so a tab strip or a table header can pin right under it.
// panelTall: the phone panel holds a list that opens below its field (the leaderboards' Jump to a board), so
// its sheet keeps 85% of the window and the list has room under the field.
// note: a Notice shown in the bar, about what the bar just did (a player search that found no one).
// searchAlone: a lead wide enough to squeeze the search on a phone (card search's presets button): the search takes its
// own line there, as it does beside a view.
// inPanel: the bar sits inside a Panel (the dashboard's goals): on the Panel's colour, on its sides, a line under it.
// counted false: what the filters narrow isn't a list with a total (/characters), so the result line has no count and no
// empty note: only its tokens and Reset.
// emptyNote: the page's own sentence for an empty result, when it knows why ("All caught up"): in place of the generic one.
const Toolbar = ({
  onStickyBottom, panelLabel = 'Filters', panelIcon = null, panelIconOnly = false, panelTall = false, searchAlone = false, inPanel = false,
  counted = true, state = {}, defaults = {}, onChange, onReset, total = 0, shown = 0, noun = 'results', note = null, emptyNote, children
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
  const others = items.filter((child) => !SLOTS.includes(child.type));
  if (process.env.NODE_ENV !== 'production' && items.some((child) => holdsSlot(child.props?.children))) {
    console.warn('Toolbar: a slot inside a fragment or another element is never read. Pass Toolbar slots as direct children.');
  }
  // A phone row holding a search, a view and the panel button left the search a few letters wide: the search
  // takes its own line there, the view and the button the next.
  const views = ofType(View);
  // A View that is a field on a phone takes the row, with no spacer before it
  const viewIsField = views.some((child) => (child.props.options?.length ?? 0) > MAX_SEGMENTS);
  const searchOwnRow = searches.length > 0 && (views.length > 0 || searchAlone);
  const differs = (child) => !same(state[slotKey(child)], defaults[slotKey(child)]);

  // The panel's count: every Show, Filter and Sort away from its default.
  const panelSlots = [...shows, ...filters, ...sorts];
  const panelChanged = panelSlots.filter(differs);
  const hasPanel = Boolean(panel) || panelSlots.length > 0;
  const buttonLabel = panelChanged.length ? `${panelLabel} (${panelChanged.length})` : panelLabel;

  // What narrows the list, in the row's order, each with its own way back here.
  const narrowingFilters = filters.filter((child) => !child.props.display);
  const narrowing = [
    ...searches.filter(differs).map((child) => ({ key: slotKey(child), text: `"${state[slotKey(child)]}"`, label: `search "${state[slotKey(child)]}"` })),
    ...shows.filter(differs).map((child) => {
      const label = child.props.options.find(([value]) => value === state[slotKey(child)])?.[1] ?? '';
      return { key: slotKey(child), text: label, label };
    }),
    ...narrowingFilters.filter(differs).map((child) => ({ key: slotKey(child), text: child.props.label, label: child.props.label }))
  ];
  const filtersOn = shows.filter(differs).length + narrowingFilters.filter(differs).length;
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
      bgcolor: inPanel ? 'background.paper' : 'background.default', py: 1.5,
      ...(inPanel ? { px: 2, borderBottom: 1, borderColor: 'divider' } : {}),
      // A landscape phone has no height to spare for pinned bars.
      '@media (max-height: 500px)': { position: 'static' }
    }}>
      <ToolbarContext value={row}>
        {/* Toolbar board: what narrows the list from the left, Sort and View at the far right, View last, 10 px apart.
            A phone: the search, then the panel's button and View at its end. */}
        <Stack direction="row" gap={{ xs: 1, sm: '10px' }} alignItems="flex-start"
               flexWrap={{ xs: searchOwnRow ? 'wrap' : 'nowrap', sm: 'wrap' }}>
          {searchOwnRow
            ? <Box sx={{ display: 'flex', flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>{searches}</Box>
            : searches}
          {ofType(Lead)}
          {hasPanel ? (panelIconOnly
            ? <IconButton aria-label={buttonLabel} {...panelButton}
                          sx={{ ...phoneOnly, width: 44, height: 44, bgcolor: 'action.hover', color: 'common.white' }}>
              {panelIcon}
            </IconButton>
            : <Button variant="outlined" startIcon={panelIcon ?? <IconAdjustmentsHorizontal size={18}/>} {...panelButton}
                      sx={{ ...phoneOnly, whiteSpace: 'nowrap' }}>
              {buttonLabel}
            </Button>) : null}
          {/* Both layouts are in the markup and CSS picks one, so a phone does not reflow after hydration. */}
          <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>{[...shows, ...filters, ...others]}</Box>
          <Box sx={{ flex: 1, display: { xs: views.length && !viewIsField ? 'block' : 'none', sm: 'block' } }}/>
          <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>{sorts}</Box>
          {views}
        </Stack>
        {narrowing.length ? <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1.5 }}>
          {/* A line of its own on a phone, so Reset never wraps alone after the tokens. */}
          {counted ? <Typography component="div" color="text.secondary" sx={{ fontSize: 13, lineHeight: '20px', flexBasis: { xs: '100%', sm: 'auto' } }}>
            Showing <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>{commaNotation(shown)}</Box> of {commaNotation(total)}
          </Typography> : null}
          {narrowing.map(({ key, text, label }) => <ButtonBase key={key} aria-label={`Clear ${label}`} sx={TOKEN_SX}
                                                               onClick={() => change({ [key]: defaults[key] })}>
            {text}
            <IconX size={14}/>
          </ButtonBase>)}
          {/* With nothing shown, the empty note's Reset is the one way back */}
          {shown > 0 || !counted ? <ButtonBase onClick={onReset} sx={RESET_SX}>Reset</ButtonBase> : null}
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
            <Stack gap={2}>
              {shows.length ? <PanelGroup label="Show"><Stack gap={1.5}>{shows}</Stack></PanelGroup> : null}
              {filters.length ? <PanelGroup label="Filters"><Stack direction="row" gap={1} flexWrap="wrap">{filters}</Stack></PanelGroup> : null}
              {sorts.length ? <PanelGroup label="Sort">{sorts}</PanelGroup> : null}
            </Stack>
          </ToolbarContext>}
        </Box>
      </AppDialog>
    </Box>
    {/* An empty result is a note under the toolbar (Notices board). */}
    {counted && shown === 0 && narrowing.length ? <Notice tone="info" action={{ label: 'Reset', onClick: onReset }} sx={inPanel ? { m: 2 } : undefined}>
      {emptyNote ?? `No ${noun} match. ${onSentence(filtersOn, searchOn)}`}
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
