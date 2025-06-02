import { Divider, Stack, TextField, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getSteamParams } from '../../../logins/steam';
import { isValidUrl } from '@utility/helpers';
import { LoadingButton } from '@mui/lab';

const SteamLogin = ({ setOpen }) => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);
  const [steamUrl, setSteamUrl] = useState('');
  const [error, setError] = useState('');

  const handleOpen = () => {
    window.open('https://steamcommunity.com/openid/login?' +
      'openid.ns=http://specs.openid.net/auth/2.0&' +
      'openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&' +
      'openid.identity=http://specs.openid.net/auth/2.0/identifier_select&' +
      `openid.return_to=https://www.legendsofidleon.com/steamsso/&` +
      `openid.realm=https://www.legendsofidleon.com/steamsso/&` +
      'openid.mode=checkid_setup',
      '_blank',
      'popup'
    );
  }

  return <Stack>
    <Typography variant={'body1'}>Click the Steam login button below to open a new tab, then sign in to your Steam
      account.</Typography>
    <img style={{ alignSelf: 'center', cursor: 'pointer' }} onClick={handleOpen}
         src={'https://community.fastly.steamstatic.com/public/images/signinthroughsteam/sits_01.png'}
         alt={'steam-login'}/>
    <Divider sx={{ my: 2 }}/>
    <Typography variant={'body1'}>After signing in, you'll be redirected to a Legend of Idleon page. Do not take any
      action on this page. Simply copy the URL from your browser’s address bar, return here, paste it into the box, and
      click 'Login'.</Typography>
    <Typography sx={{ mt: 1 }} variant={'body2'}>* Do not click the big blue button before copying the
      URL.</Typography>
    <TextField sx={{ mt: 2 }} error={!!error} helperText={error} value={steamUrl} onChange={(e) => {
      setError('');
      setSteamUrl(e.target.value)
    }} size={'small'} label={'Steam popup url'}/>
    <LoadingButton sx={{ mt: 2 }} loading={waitingForAuth} variant="contained" onClick={async () => {
      if (!steamUrl.startsWith('https://www.legendsofidleon.com/steamsso/')) {
        return setError('The url should start with "https://www.legendsofidleon.com/steamsso/"');
      }
      if (!isValidUrl(steamUrl)) {
        return setError('Please enter a valid steam url')
      }
      const token = await getSteamParams(steamUrl);
      if (Object.keys(token || {}).length === 0) {
        return setError('An error occurred while trying to login')
      }
      if (token && !token?.error) {
        setWaitingForAuth(true);
        dispatch({ type: 'login', data: { loginData: { token }, loginType: 'steam' } })
      } else {
        setError(`An error occurred while trying to login ${`- ${token?.message}` || ''}`)
      }
    }}>Login</LoadingButton>
  </Stack>;
};

export default SteamLogin;

