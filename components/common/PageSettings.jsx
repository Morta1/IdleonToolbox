import React, { createContext, useContext, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, MenuItem, Popover, Stack, Switch, TextField, Typography, useMediaQuery } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { IconSettings } from '@tabler/icons-react';
import AppDialog from '@components/common/Overlays/AppDialog';
import NumberField from '@components/common/NumberField';
import { usePageHeaderSlot } from '@components/common/NavBar/PageHeader';
import useToolbarState, { same } from '@hooks/useToolbarState';

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

// The board's dot: a setting differs from its default. Its room is always kept, so the button never changes width.
const DOT_SX = { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', ml: '2px', alignSelf: 'flex-start', mt: 0.5 };
const SettingsContext = createContext({ state: {}, onChange: () => {} });

// The settings that change the numbers on the page (Toolbar board, "Where a control goes"), the ones only one tab
// reads too, grouped under that tab's name (Group): the gear at the end of the header row opens them, a dot says one differs from its default, Reset puts the defaults back. A popover on
// desktop, a sheet on a phone. It renders into the header's slot, which exists only after mount, so the export has no
// gear and nothing mismatches. onOpen: a page whose settings live in their own window (the dashboard's alerts): the same
// header button and dot, under its own label, and a click opens that window instead (changed says when the dot shows).
const PageSettings = ({ state, defaults, onChange, onReset, onOpen, label = 'Page settings', changed: isChanged, children }) => {
  const node = usePageHeaderSlot('settings');
  const [anchor, setAnchor] = useState(null);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const panelId = useId();
  const rowsRef = useRef(null);
  if (!node) return null;
  const changed = isChanged ?? Object.keys(defaults ?? {}).some((key) => !same(state?.[key], defaults[key]));
  const close = () => setAnchor(null);
  const buttonLabel = <>
    {label}
    <Box component="span" aria-hidden sx={[DOT_SX, { visibility: changed ? 'visible' : 'hidden' }]}/>
    {changed ? <Box component="span" sx={visuallyHidden}>, changed</Box> : null}
  </>;
  if (onOpen) {
    return createPortal(<Button startIcon={<IconSettings size={18}/>} aria-haspopup="dialog" onClick={onOpen}>{buttonLabel}</Button>, node);
  }
  const rows = <SettingsContext value={{ state, onChange, close }}><Stack ref={rowsRef} gap={2}>{children}</Stack></SettingsContext>;
  // Reset leaves with the change it undid: the focus goes on to the first setting rather than to the popover or
  // the sheet itself
  const resetHere = () => {
    onReset();
    requestAnimationFrame(() => rowsRef.current?.querySelector('input, button, [tabindex="0"]')?.focus());
  };
  return createPortal(<>
    <Button startIcon={<IconSettings size={18}/>} aria-haspopup="dialog" aria-expanded={Boolean(anchor)}
            aria-controls={anchor ? panelId : undefined} onClick={(event) => setAnchor(event.currentTarget)}>
      {buttonLabel}
    </Button>
    {isPhone
      ? <AppDialog open={Boolean(anchor)} onClose={close} id={panelId} size="s" title="Page settings"
                   actions={[...(changed ? [{ label: 'Reset', onClick: resetHere }] : []), { label: 'Done', main: true }]}>
        {rows}
      </AppDialog>
      : <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={close} id={panelId}
                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                 slotProps={{ paper: { role: 'dialog', 'aria-label': 'Page settings', sx: { width: 360, maxWidth: 'calc(100vw - 32px)', p: 2 } } }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 2, minHeight: 32 }}>
          <Typography variant="sectionTitle" component="h2">Page settings</Typography>
          {changed ? <Button size="small" onClick={resetHere} sx={{ ml: 'auto' }}>Reset</Button> : null}
        </Stack>
        {rows}
      </Popover>}
  </>, node);
};

// One on/off setting: its name, one line on what it changes, the switch.
const Toggle = ({ name, label, help }) => {
  const { state, onChange } = useContext(SettingsContext);
  const helpId = useId();
  return <Stack direction="row" alignItems="center" gap={2}>
    <Stack sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" component="label" htmlFor={`${helpId}-input`}>{label}</Typography>
      <Typography variant="caption" color="text.secondary" id={helpId}>{help}</Typography>
    </Stack>
    <Switch checked={Boolean(state?.[name])} onChange={(event) => onChange({ [name]: event.target.checked })}
            inputProps={{ id: `${helpId}-input`, role: 'switch', 'aria-describedby': helpId }}/>
  </Stack>;
};
PageSettings.Toggle = Toggle;

// One number setting: the field (empty is the default, which it shows as its placeholder) and one line on what it changes.
const NumberSetting = ({ name, label, help, defaultValue, min, max, integer, unit }) => {
  const { state, onChange } = useContext(SettingsContext);
  return <NumberField label={label} help={help} value={state?.[name] ?? null} defaultValue={defaultValue}
                      min={min} max={max} integer={integer} unit={unit} sx={{ width: '100%' }}
                      onChange={(next) => onChange({ [name]: next })}/>;
};
PageSettings.Number = NumberSetting;

// One choice from a list ([value, label]): the field and one line on what it changes. defaultValue is what an unset
// setting (null) means, shown as picked; picking it again stores nothing.
const SelectSetting = ({ name, label, help, options, defaultValue }) => {
  const { state, onChange } = useContext(SettingsContext);
  return <TextField select label={label} helperText={help} value={state?.[name] ?? defaultValue ?? ''} fullWidth
                    onChange={(event) => onChange({
                      [name]: defaultValue !== undefined && event.target.value === defaultValue ? null : event.target.value
                    })}>
    {options.map(([value, text]) => <MenuItem key={value} value={value}>{text}</MenuItem>)}
  </TextField>;
};
PageSettings.Select = SelectSetting;

// A setting that starts a mode on the page instead of holding a value (the Pets tab's simulation): its name, one line on
// what it changes, and the button that starts it. The panel closes, so the page shows the mode.
const ActionSetting = ({ label, help, action }) => {
  const { close } = useContext(SettingsContext);
  const helpId = useId();
  return <Stack direction="row" alignItems="center" gap={2}>
    <Stack sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="caption" color="text.secondary" id={helpId}>{help}</Typography>
    </Stack>
    <Button aria-describedby={helpId} sx={{ flexShrink: 0 }} onClick={() => {
      close?.();
      action?.onClick?.();
    }}>{action?.label}</Button>
  </Stack>;
};
PageSettings.Action = ActionSetting;

// The settings one tab reads, under that tab's name.
const Group = ({ title, children }) => {
  const titleId = useId();
  return <Stack role="group" aria-labelledby={titleId} gap={2}>
    <Typography variant="groupLabel" component="h3" id={titleId} color="text.secondary">{title}</Typography>
    {children}
  </Stack>;
};
PageSettings.Group = Group;

export default PageSettings;
