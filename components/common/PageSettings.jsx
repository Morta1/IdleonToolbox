import React, { createContext, useContext, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import { Box, Button, IconButton, MenuItem, Popover, Stack, Switch, TextField, Typography, useMediaQuery } from '@mui/material';
import { IconSettings, IconX } from '@tabler/icons-react';
import { cardSurface } from '@components/common/cards/tokens';
import AppDialog from '@components/common/Overlays/AppDialog';
import NumberField, { fieldNumber, rangeText } from '@components/common/NumberField';
import { usePageHeaderSlot } from '@components/common/NavBar/PageHeader';
import useToolbarState, { same } from '@hooks/useToolbarState';
import { headerActionSx, headerGearSx, widerThanPhone } from '@components/common/NavBar/headerAction';

// A page's settings, remembered per page in this browser: the player's edits only (useToolbarState's rule).
export const usePageSettings = (page, defaults) => useToolbarState(page, defaults, { scope: 'page-settings' });

// One gear over several stores: the page's own settings and a tab's, each kept under the key it already had, so a
// setting that moved here keeps its value. parts are { state, defaults, set }, defaults holding only the keys the gear
// shows; a change goes to the part that owns its key, and Reset puts each part's shown keys back.
export const joinSettings = (...parts) => ({
  state: Object.assign({}, ...parts.map((part) => part.state)),
  defaults: Object.assign({}, ...parts.map((part) => part.defaults)),
  onChange: (patch) => parts.forEach(({ defaults, set }) => {
    const own = Object.entries(patch).filter(([key]) => Object.hasOwn(defaults, key));
    if (own.length) set(Object.fromEntries(own));
  }),
  onReset: () => parts.forEach(({ defaults, set }) => set(defaults))
});

// The board's dot: a setting differs from its default. It sits on the button's corner, so the button never changes width.
const DOT_SX = { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' };
const SettingsContext = createContext({ state: {}, onChange: () => {} });
// Toolbar board: an outlined control at the header's right end, as Pin and Goals beside it; on a phone the gear alone.
const BUTTON_SX = [headerActionSx, headerGearSx];
// One row per setting with a line between rows (Toolbar board's panel). A child is a row, a page's own row (Stamps'
// snapshot) or a Group, whose title and rows follow the same rules. px: the panel's 16, or 0 inside a sheet's own gutter.
const rowsSx = (px) => ({
  '& > :not([data-settings-group]), & [data-settings-group] > *': { px, py: 1.25, minHeight: 44, boxSizing: 'border-box' },
  '& > * + *, & [data-settings-group] > * + * + *': { borderTop: 1, borderColor: 'divider' },
  '& [data-settings-group] > h3': { pt: 1.5, pb: 0.5, minHeight: 0 }
});

// Docked on a desktop: a panel under the header row, its settings side by side, left to right, so they take a row or two
// of the page rather than a long list. A group's title spans the row and its settings follow it. Space parts them, not
// lines: a line under a row that isn't full stops short. Open or closed is remembered per page in this browser, so a
// player who keeps a page's settings in view opens them once.
const DOCK_SX = (theme) => ({ ...cardSurface(theme), mb: 2, overflow: 'hidden' });
const DOCK_HEAD_SX = { px: 2, py: 0.5, minHeight: 44, boxSizing: 'border-box', gap: 1, borderBottom: 1, borderColor: 'divider' };
const DOCK_GRID_SX = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', columnGap: 3, py: 0.5,
  '& [data-settings-group]': { display: 'contents' },
  '& > *, & [data-settings-group] > *': { borderTop: 0 },
  '& [data-settings-group] > h3': { gridColumn: '1 / -1' }
};
const DOCKED_KEY = 'page-settings:open';

// The settings that change the numbers on the page (Toolbar board, "Where a control goes"), the ones only one tab
// reads too, grouped under that tab's name (Group): the gear at the end of the header row opens them, a dot says one differs from its default, Reset puts the defaults back. Docked under
// the header on a desktop, a sheet on a phone, and a popover where the header has no room for the dock. It renders into
// the header's slots, which exist only after mount, so the export has no gear and nothing mismatches. onOpen: a page
// whose settings live in their own window (the dashboard's alerts): the same header button and dot, under its own
// label, and a click opens that window instead (changed says when the dot shows).
const PageSettings = ({ state, defaults, onChange, onReset, onOpen, label = 'Page settings', changed: isChanged, children }) => {
  const node = usePageHeaderSlot('settings');
  const dockNode = usePageHeaderSlot('panel');
  const router = useRouter();
  const pathname = router?.pathname ?? '';
  // No default: nothing is stored until a player opens one
  const [dockedPages, setDockedPages] = useLocalStorage({ key: DOCKED_KEY });
  const [anchor, setAnchor] = useState(null);
  // Where the button ends on screen: the panel stays under it and scrolls itself when tall, instead of Popover lifting it
  // over its own button. At least 240 px, so a button low on a short window still opens a usable panel.
  const [buttonBottom, setButtonBottom] = useState(0);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const panelId = useId();
  const rowsRef = useRef(null);
  if (!node) return null;
  const changed = isChanged ?? Object.keys(defaults ?? {}).some((key) => !same(state?.[key], defaults[key]));
  const close = () => setAnchor(null);
  const buttonLabel = <>
    <Box component="span" sx={widerThanPhone}>{label}</Box>
    <Box component="span" aria-hidden sx={[DOT_SX, { visibility: changed ? 'visible' : 'hidden' }]}/>
  </>;
  // The name lives here, not in the words: a phone's button is the gear alone
  const buttonName = changed ? `${label}, changed` : label;
  if (onOpen) {
    return createPortal(<Button variant="outlined" startIcon={<IconSettings size={18}/>} aria-label={buttonName} aria-haspopup="dialog" onClick={onOpen} sx={BUTTON_SX}>{buttonLabel}</Button>, node);
  }
  const docks = !isPhone && Boolean(dockNode);
  const docked = docks && Boolean(dockedPages?.[pathname]);
  const toggleDock = () => setDockedPages((current) => ({ ...current, [pathname]: !current?.[pathname] }));
  // An action that starts a mode closes a popover or a sheet so the page shows the mode; a dock already leaves it in view
  const rows = <SettingsContext value={{ state, onChange, close: docks ? undefined : close }}>
    <Stack ref={rowsRef} sx={[rowsSx(isPhone ? 0 : 2), docks && DOCK_GRID_SX]}>{children}</Stack>
  </SettingsContext>;
  // Reset leaves with the change it undid: the focus goes on to the first setting rather than to the popover or
  // the sheet itself
  const resetHere = () => {
    onReset();
    requestAnimationFrame(() => rowsRef.current?.querySelector('input, button, [tabindex="0"]')?.focus());
  };
  const open = docks ? docked : Boolean(anchor);
  const button = <Button variant="outlined" startIcon={<IconSettings size={18}/>} aria-label={buttonName}
                         aria-haspopup={docks ? undefined : 'dialog'} aria-expanded={open} aria-controls={open ? panelId : undefined} sx={BUTTON_SX}
                         onClick={(event) => {
                           if (docks) return toggleDock();
                           setButtonBottom(event.currentTarget.getBoundingClientRect().bottom);
                           setAnchor(event.currentTarget);
                         }}>
    {buttonLabel}
  </Button>;
  if (docks) {
    return <>
      {createPortal(button, node)}
      {docked ? createPortal(<Box id={panelId} role="region" aria-label="Page settings" sx={DOCK_SX}>
        <Stack direction="row" alignItems="center" sx={DOCK_HEAD_SX}>
          <Typography component="h2" sx={{ fontSize: 15, lineHeight: '24px', fontWeight: 500, mr: 'auto' }}>Page settings</Typography>
          {changed ? <Button size="small" onClick={resetHere} sx={{ fontSize: 13 }}>Reset</Button> : null}
          <IconButton size="small" aria-label="Hide page settings" onClick={toggleDock}><IconX size={18}/></IconButton>
        </Stack>
        {rows}
      </Box>, dockNode) : null}
    </>;
  }
  return createPortal(<>
    {button}
    {isPhone
      ? <AppDialog open={Boolean(anchor)} onClose={close} id={panelId} size="s" title="Page settings"
                   actions={[...(changed ? [{ label: 'Reset', onClick: resetHere }] : []), { label: 'Done', main: true }]}>
        {rows}
      </AppDialog>
      : <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={close} id={panelId}
                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                 slotProps={{
                   paper: {
                     role: 'dialog', 'aria-label': 'Page settings', sx: {
                       width: 400, maxWidth: 'calc(100vw - 32px)', pb: '6px', overflowY: 'auto',
                       maxHeight: `max(240px, calc(100vh - ${buttonBottom + 20}px - var(--nitro-ad-height, 0px)))`
                     }
                   }
                 }}>
        <Stack direction="row" alignItems="center" sx={{
          position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 2, py: 0.75, minHeight: 44, boxSizing: 'border-box',
          borderBottom: 1, borderColor: 'divider'
        }}>
          <Typography component="h2" sx={{ fontSize: 15, lineHeight: '24px', fontWeight: 500 }}>Page settings</Typography>
          {changed ? <Button size="small" onClick={resetHere} sx={{ ml: 'auto', fontSize: 13 }}>Reset</Button> : null}
        </Stack>
        {rows}
      </Popover>}
  </>, node);
};

// The gear's room on a view of its page that has no gear (Pets' Pet Mart tab): Pin and Goals stay put in the right-aligned
// group while the player moves between the views.
export const PageSettingsRoom = () => {
  const node = usePageHeaderSlot('settings');
  return node ? createPortal(<Button variant="outlined" startIcon={<IconSettings size={18}/>} sx={[...BUTTON_SX, { visibility: 'hidden' }]}>
    <Box component="span" sx={widerThanPhone}>Page settings</Box>
  </Button>, node) : null;
};

// A setting's row: its name and one line on what it changes on the left, in words nothing hides; its control on the right.
const Row = ({ label, labelFor, help, helpId, children }) => <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
  <Stack sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="body2" component={labelFor ? 'label' : 'div'} htmlFor={labelFor}>{label}</Typography>
    {help ? <Typography variant="caption" color="text.secondary" id={helpId}>{help}</Typography> : null}
  </Stack>
  {children}
</Stack>;

// One on/off setting: its name, one line on what it changes, the switch.
const Toggle = ({ name, label, help }) => {
  const { state, onChange } = useContext(SettingsContext);
  const helpId = useId();
  return <Row label={label} labelFor={`${helpId}-input`} help={help} helpId={helpId}>
    <Switch checked={Boolean(state?.[name])} onChange={(event) => onChange({ [name]: event.target.checked })}
            inputProps={{ id: `${helpId}-input`, role: 'switch', 'aria-describedby': helpId }}/>
  </Row>;
};
PageSettings.Toggle = Toggle;

// One number setting: the field (empty is the default, which it shows as its placeholder) and one line on what it changes,
// or its range where the page has no words for it. The field is the board's 72 px, wider when its number needs the room.
const NumberSetting = ({ name, label, help, defaultValue, min, max, integer, unit }) => {
  const { state, onChange } = useContext(SettingsContext);
  const value = state?.[name] ?? null;
  const digits = String(fieldNumber(value ?? defaultValue ?? 0)).length + (unit ? 2 : 0);
  return <Row label={label} help={help ?? rangeText(min, max)}>
    <NumberField ariaLabel={label} help={false} inline value={value} defaultValue={defaultValue} min={min} max={max} integer={integer} unit={unit}
                 sx={{ width: Math.max(72, 24 + digits * 10), flexShrink: 0 }} onChange={(next) => onChange({ [name]: next })}/>
  </Row>;
};
PageSettings.Number = NumberSetting;

// One free-text setting: the field and one line on what it changes. parse turns the text into the stored value, or
// returns an error message to show in place of the help; only a valid text is stored. Empty is the default (null).
const TextSetting = ({ name, label, help, placeholder, parse, width = 200 }) => {
  const { state, onChange } = useContext(SettingsContext);
  const stored = state?.[name] ?? '';
  const [draft, setDraft] = useState(stored);
  const [lastStored, setLastStored] = useState(stored);
  // Reset (or another tab) moved the stored value: the field follows it
  if (stored !== lastStored) {
    setLastStored(stored);
    setDraft(stored);
  }
  const error = draft.trim() ? parse?.(draft)?.error : null;
  const helpId = useId();
  const shownHelp = error ? <Box component="span" sx={{ color: 'error.main' }}>{error}</Box> : help;
  return <Row label={label} labelFor={`${helpId}-input`} help={shownHelp} helpId={helpId}>
    <TextField value={draft} placeholder={placeholder} error={Boolean(error)} sx={{ width, flexShrink: 0 }}
               slotProps={{ htmlInput: { id: `${helpId}-input`, 'aria-describedby': helpId } }}
               onChange={(event) => {
                 const next = event.target.value;
                 setDraft(next);
                 if (!next.trim()) return onChange({ [name]: null });
                 if (!parse?.(next)?.error) onChange({ [name]: next });
               }}/>
  </Row>;
};
PageSettings.Text = TextSetting;

// One choice from a list ([value, label]): the field and one line on what it changes. defaultValue is what an unset
// setting (null) means, shown as picked; picking it again stores nothing.
const SelectSetting = ({ name, label, help, options, defaultValue }) => {
  const { state, onChange } = useContext(SettingsContext);
  return <Row label={label} help={help}>
    <TextField select value={state?.[name] ?? defaultValue ?? ''} sx={{ flexShrink: 0, maxWidth: '60%' }}
               slotProps={{ select: { SelectDisplayProps: { 'aria-label': label } } }}
               onChange={(event) => onChange({
                 [name]: defaultValue !== undefined && event.target.value === defaultValue ? null : event.target.value
               })}>
      {options.map(([value, text]) => <MenuItem key={value} value={value}>{text}</MenuItem>)}
    </TextField>
  </Row>;
};
PageSettings.Select = SelectSetting;

// A setting that starts a mode on the page instead of holding a value (the Pets tab's simulation): its name, one line on
// what it changes, and the button that starts it. The panel closes, so the page shows the mode.
const ActionSetting = ({ label, help, action }) => {
  const { close } = useContext(SettingsContext);
  const helpId = useId();
  return <Row label={label} help={help} helpId={helpId}>
    <Button aria-describedby={helpId} sx={{ flexShrink: 0 }} onClick={() => {
      close?.();
      action?.onClick?.();
    }}>{action?.label}</Button>
  </Row>;
};
PageSettings.Action = ActionSetting;

// The settings one tab reads, under that tab's name.
const Group = ({ title, children }) => {
  const titleId = useId();
  return <Stack role="group" aria-labelledby={titleId} data-settings-group>
    <Typography variant="groupLabel" component="h3" id={titleId} color="text.secondary">{title}</Typography>
    {children}
  </Stack>;
};
PageSettings.Group = Group;

export default PageSettings;
