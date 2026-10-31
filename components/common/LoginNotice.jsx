import { useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import { AppContext } from './context/AppProvider';
import NoticeSnackbar, { NoticeStack } from './NoticeSnackbar';

// A saved login that fails to restore on page load has no dialog to show the reason in.
const LoginNotice = () => {
  const { state, dispatch } = useContext(AppContext);
  const notice = state?.loginNotice;
  if (!notice?.message) return null;

  return <NoticeStack>
    <NoticeSnackbar stacked
                    label={<Stack>
                      <Typography variant={'body2'} fontWeight={600}>{notice.message}</Typography>
                      {notice.hint ? <Typography variant={'body2'}>{notice.hint}</Typography> : null}
                    </Stack>}
                    onClose={() => dispatch({ type: 'data', data: { loginNotice: null } })}/>
  </NoticeStack>;
};

export default LoginNotice;
