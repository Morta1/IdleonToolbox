import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { SHEET_BOTTOM } from '@components/common/Overlays/OverlayActions';

// MUI's disabled contained look, without the disabled attribute: a disabled button drops the focus to the
// dialog's frame, so a busy one stays focusable, says so with aria-disabled and ignores presses.
const BUSY_SX = {
  bgcolor: 'action.disabledBackground', color: 'action.disabled', boxShadow: 'none', cursor: 'default',
  '&:hover': { bgcolor: 'action.disabledBackground', boxShadow: 'none' }
};

// A flow's one blue button (Sign in board: the same contained button on every method). On a phone it
// sticks to the bottom of the dialog's scrolling body, so it never sits under the fold, and ends where a
// sheet's actions do: the safe area and, until it is answered, the consent banner. status is the line
// that says what the flow waits for ("Waiting for Google"), read out once: under the button, and on a
// phone above it, so it adds no room under the button.
const FlowAction = ({ status, loading = false, disabled = false, onClick, children, ...buttonProps }) => {
  const busy = loading || disabled;
  return <Box sx={{
    position: { xs: 'sticky', sm: 'static' }, bottom: 0, zIndex: 1, mt: { xs: 'auto', sm: 3 }, pt: 2,
    pb: { xs: SHEET_BOTTOM, sm: 0 }, bgcolor: 'background.paper',
    display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'column' }
  }}>
    <Button variant="contained" fullWidth {...buttonProps} aria-disabled={busy || undefined} aria-busy={loading || undefined}
            onClick={busy ? undefined : onClick} sx={busy ? BUSY_SX : undefined}>
      {/* While loading the label turns transparent, as MUI's own loading does, so the button keeps its name */}
      <Box component="span" sx={loading ? { color: 'transparent' } : undefined}>{children}</Box>
      {loading ? <CircularProgress aria-hidden color="inherit" size={16} sx={{ position: 'absolute' }}/> : null}
    </Button>
    <Typography role="status" variant="caption" color="text.secondary" sx={{
      display: 'block', textAlign: 'center', mt: { xs: 0, sm: 1 }, mb: { xs: status ? 1 : 0, sm: 0 }, minHeight: { xs: 0, sm: 20 }
    }}>
      {status ?? ''}
    </Typography>
  </Box>;
};

export default FlowAction;
