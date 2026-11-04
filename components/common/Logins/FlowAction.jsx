import { Box, Button, CircularProgress } from '@mui/material';
import { SHEET_BOTTOM } from '@components/common/Overlays/OverlayActions';

// MUI's disabled contained look, without the disabled attribute: a disabled button drops the focus to the
// dialog's frame, so a busy one stays focusable, says so with aria-disabled and ignores presses.
const BUSY_SX = {
  bgcolor: 'action.disabledBackground', color: 'action.disabled', boxShadow: 'none', cursor: 'default',
  '&:hover': { bgcolor: 'action.disabledBackground', boxShadow: 'none' }
};
// The flow waits on another site: the button dims and ignores presses, the status line says what it waits for. At
// .65 its dark label still reads at 5:1 on the dimmed blue, where DIM's .55 would read at 4:1.
const INERT_SX = { opacity: 0.65, cursor: 'default', '&:hover': { bgcolor: 'primary.main' } };
const DOT_SX = {
  width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main',
  boxShadow: (theme) => `0 0 0 4px ${(theme.vars || theme).palette.primary.soft}`
};

// The blue button of the Sign in board, the same on every method. icon: what follows its label. inert: dimmed,
// and ignores presses, for a flow that is waiting.
export const ActionButton = ({ loading = false, disabled = false, inert = false, icon, onClick, children, sx, ...buttonProps }) => {
  const busy = loading || disabled;
  const stateSx = busy ? BUSY_SX : inert ? INERT_SX : {};
  return <Button variant="contained" disableElevation {...buttonProps} aria-disabled={busy || inert || undefined} aria-busy={loading || undefined}
                 onClick={busy || inert ? undefined : onClick} sx={{ fontWeight: 400, letterSpacing: 'normal', ...stateSx, ...sx }}>
    {/* While loading the label turns transparent, as MUI's own loading does, so the button keeps its name */}
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...(loading ? { color: 'transparent' } : {}) }}>
      {children}{icon}
    </Box>
    {loading ? <CircularProgress aria-hidden color="inherit" size={16} sx={{ position: 'absolute' }}/> : null}
  </Button>;
};

// A flow's one button at full width. On a phone it sticks to the bottom of the dialog's scrolling body, edge to
// edge above a line, so it never sits under the fold, and ends where a sheet's actions do: the safe area and,
// until it is answered, the consent banner. status is the line that says what the flow waits for ("Waiting for
// Google"), read out once: under the button, and on a phone above it, so it adds no room under the button.
// phoneOnly: a flow whose desktop draws its actions inside its steps (Steam).
const FlowAction = ({ status, phoneOnly = false, sx, ...action }) => (
  <Box sx={{
    position: { xs: 'sticky', sm: 'static' }, bottom: 0, zIndex: 1, mt: { xs: 'auto', sm: 0 }, pt: { xs: '12px', sm: 2 },
    mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, pb: { xs: SHEET_BOTTOM, sm: 0 }, borderTop: { xs: 1, sm: 0 }, borderColor: { xs: 'divider' },
    bgcolor: 'background.paper', display: { xs: 'flex', sm: phoneOnly ? 'none' : 'flex' }, flexDirection: { xs: 'column-reverse', sm: 'column' },
    ...sx
  }}>
    <ActionButton fullWidth {...action}/>
    <Box role="status" sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: 13, color: 'primary.main',
      mt: { xs: 0, sm: status ? 2 : 0 }, mb: { xs: status ? 1.5 : 0, sm: 0 }
    }}>
      {status ? <><Box component="span" aria-hidden sx={DOT_SX}/>{status}</> : null}
    </Box>
  </Box>
);

export default FlowAction;
