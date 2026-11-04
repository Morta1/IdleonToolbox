import { Link, Stack, TextField } from '@mui/material';
import React, { useContext, useState } from 'react';
import { loadFirebase } from '../../../firebase/lazy';
import { AppContext } from '../context/AppProvider';
import { describeLoginError, toLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';
import FlowAction from './FlowAction';
import { FIELD_SX, FLOW_SX } from './look';
import { touchTarget } from '../../../styles/theme/darkTheme';

const EmailLogin = ({ onStart }) => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setSubmitted(false);
    setError(null);
    const setter = e.target.name === 'email' ? setEmail : setPassword;
    setter(e.target.value);
  }

  const handleKeyDown = async (e) => {
    // key, not code: the numpad's Enter reports code 'NumpadEnter'.
    if (e.key === 'Enter') {
      await handleSubmit();
    }
  }

  const handleSubmit = async () => {
    setSubmitted(true);
    if (email && password) {
      onStart?.();
      setWaitingForAuth(true);
      let data;
      try {
        const { signInWithEmailPassword } = await loadFirebase();
        data = await signInWithEmailPassword({ email, password });
        dispatch({ type: 'login', data: { loginData: data, loginType: 'email' } })
      } catch (error) {
        setWaitingForAuth(false);
        dispatch({ type: 'loginError', data: toLoginError(error) })
      }
    } else {
      setError(describeLoginError('EMAIL_MISSING_FIELDS'));
    }
  }

  return (
    <Stack sx={FLOW_SX}>
      <Stack gap={2}>
        <TextField sx={FIELD_SX} inputProps={{ autoComplete: 'email', type: 'email', inputMode: 'email' }} value={email} error={submitted && !email} name={'email'}
                   onChange={handleChange}
                   onKeyDown={handleKeyDown}
                   label={'Email'}/>
        <TextField sx={FIELD_SX} value={password} error={submitted && !password} name={'password'}
                   onChange={handleChange}
                   onKeyDown={handleKeyDown}
                   label={'Password'}
                   inputProps={{ type: 'password', autoComplete: 'current-password' }}/>
      </Stack>
      <LoginErrorAlert sx={{ mt: 2 }} error={state?.loginError || error}/>
      {/* Under the button as the board draws it; on a phone above it, where the button sticks to the bottom */}
      <FlowAction onClick={handleSubmit} loading={waitingForAuth} sx={{ order: { xs: 1, sm: 0 } }}>Sign in</FlowAction>
      <Link href="https://www.reddit.com/r/idleon/comments/12ccw2h/steam_email/" target="_blank" rel="noopener" underline="hover"
            sx={{ mt: 2, alignSelf: 'center', order: { xs: 0, sm: 1 }, fontSize: 13.5, fontWeight: 500, ...touchTarget }}>
        Forgot which email you used?
      </Link>
    </Stack>
  );
};


export default EmailLogin;
