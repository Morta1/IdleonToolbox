import Notice from '@components/common/Notice';

// The one place a sign-in error is drawn, so every flow shows the same message and next step. The
// hint is the next step, so the error carries no Reload, which would close the dialog; only a failure
// the toolbox cannot name (UNKNOWN, whose hint says to report it) keeps Report on Discord. Notice is
// read only in render: Notice imports the dialog these flows live in.
const LoginErrorAlert = ({ error, sx }) => {
  if (!error?.message) return null;
  return <Notice tone={'error'} action={error.code === 'UNKNOWN' ? null : false} sx={sx}>
    {error.hint ? `${error.message}. ${error.hint}` : `${error.message}.`}
  </Notice>;
};

export default LoginErrorAlert;
