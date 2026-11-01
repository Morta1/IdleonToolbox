import { Box, Button, Typography } from '@mui/material';

// A flow's one blue button (Sign in board: the same contained button on every method). On a phone it
// sticks to the bottom of the dialog's scrolling body, so it never sits under the fold. status is the
// line under it while the flow waits ("Waiting for Google"), read out once.
const FlowAction = ({ status, children, ...buttonProps }) => <Box sx={{
  position: { xs: 'sticky', sm: 'static' }, bottom: 0, zIndex: 1, mt: { xs: 'auto', sm: 3 }, pt: 2,
  pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 0 }, bgcolor: 'background.paper'
}}>
  <Button variant="contained" fullWidth {...buttonProps}>{children}</Button>
  <Typography role="status" variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1, minHeight: 20 }}>
    {status ?? ''}
  </Typography>
</Box>;

export default FlowAction;
