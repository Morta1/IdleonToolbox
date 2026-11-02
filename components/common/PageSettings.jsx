import React, { createContext, useContext, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, Popover, Stack, Switch, Typography, useMediaQuery } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { IconSettings } from '@tabler/icons-react';
import AppDialog from '@components/common/Overlays/AppDialog';
import { usePageHeaderSlot } from '@components/common/NavBar/PageHeader';
import useToolbarState, { same } from '@hooks/useToolbarState';

// A page's settings, remembered per page in this browser: the player's edits only (useToolbarState's rule).
export const usePageSettings = (page, defaults) => useToolbarState(page, defaults, { scope: 'page-settings' });

// The board's dot: a setting differs from its default. Its room is always kept, so the button never changes width.
const DOT_SX = { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', ml: '2px', alignSelf: 'flex-start', mt: 0.5 };
const SettingsContext = createContext({ state: {}, onChange: () => {} });

// The settings that change the numbers on the whole page (Toolbar board, "Where a control goes"): the gear at the end
// of the header row opens them, a dot says one differs from its default, Reset puts the defaults back. A popover on
// desktop, a sheet on a phone. It renders into the header's slot, which exists only after mount, so the export has no
// gear and nothing mismatches.
const PageSettings = ({ state, defaults, onChange, onReset, children }) => {
  const node = usePageHeaderSlot('settings');
  const [anchor, setAnchor] = useState(null);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const panelId = useId();
  const rowsRef = useRef(null);
  if (!node) return null;
  const changed = Object.keys(defaults).some((key) => !same(state?.[key], defaults[key]));
  const close = () => setAnchor(null);
  const rows = <SettingsContext value={{ state, onChange }}><Stack ref={rowsRef} gap={2}>{children}</Stack></SettingsContext>;
  // Reset leaves with the change it undid: the focus goes on to the first setting rather than to the popover or
  // the sheet itself
  const resetHere = () => {
    onReset();
    requestAnimationFrame(() => rowsRef.current?.querySelector('input, button, [tabindex="0"]')?.focus());
  };
  return createPortal(<>
    <Button startIcon={<IconSettings size={18}/>} aria-haspopup="dialog" aria-expanded={Boolean(anchor)}
            aria-controls={anchor ? panelId : undefined} onClick={(event) => setAnchor(event.currentTarget)}>
      Page settings
      <Box component="span" aria-hidden sx={[DOT_SX, { visibility: changed ? 'visible' : 'hidden' }]}/>
      {changed ? <Box component="span" sx={visuallyHidden}>, changed</Box> : null}
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

export default PageSettings;
