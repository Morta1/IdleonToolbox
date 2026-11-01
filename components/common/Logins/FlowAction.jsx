import { Box, Button, Typography } from '@mui/material';
import { SHEET_BOTTOM } from '@components/common/Overlays/OverlayActions';

// A flow's one blue button (Sign in board: the same contained button on every method). On a phone it
// sticks to the bottom of the dialog's scrolling body, so it never sits under the fold, and ends where a
// sheet's actions do: the safe area and, until it is answered, the consent banner. status is the line
// that says what the flow waits for ("Waiting for Google"), read out once: under the button, and on a
// phone above it, so it adds no room under the button.
const FlowAction = ({ status, children, ...buttonProps }) => <Box sx={{
  position: { xs: 'sticky', sm: 'static' }, bottom: 0, zIndex: 1, mt: { xs: 'auto', sm: 3 }, pt: 2,
  pb: { xs: SHEET_BOTTOM, sm: 0 }, bgcolor: 'background.paper',
  display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'column' }
}}>
  <Button variant="contained" fullWidth {...buttonProps}>{children}</Button>
  <Typography role="status" variant="caption" color="text.secondary" sx={{
    display: 'block', textAlign: 'center', mt: { xs: 0, sm: 1 }, mb: { xs: status ? 1 : 0, sm: 0 }, minHeight: { xs: 0, sm: 20 }
  }}>
    {status ?? ''}
  </Typography>
</Box>;

export default FlowAction;
