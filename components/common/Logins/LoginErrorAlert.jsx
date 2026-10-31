import { Alert, AlertTitle } from '@mui/material';

// The one place a login error is drawn, so every login tab shows the same message and next step.
// Takes a toLoginError() result.
const LoginErrorAlert = ({ error, sx }) => {
  if (!error?.message) return null;
  return <Alert severity="error" sx={sx}>
    <AlertTitle sx={{ mb: error.hint ? 0.5 : 0 }}>{error.message}</AlertTitle>
    {error.hint}
  </Alert>;
};

export default LoginErrorAlert;
