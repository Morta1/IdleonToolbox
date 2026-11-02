import { Link, Stack, TextField } from '@mui/material';
import React, { useContext, useState } from 'react';
import { loadFirebase } from '../../../firebase/lazy';
import { AppContext } from '../context/AppProvider';
import { describeLoginError, toLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';
import FlowAction from './FlowAction';

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
    <Stack sx={{ flex: 1 }}>
      <Stack gap={3} sx={{ pt: 1 }}>
        <TextField inputProps={{ autoComplete: 'email', type: 'email', inputMode: 'email' }} value={email} error={submitted && !email} name={'email'}
                   onChange={handleChange}
                   onKeyDown={handleKeyDown}
                   label={'Email'}/>
        <TextField value={password} error={submitted && !password} name={'password'}
                   onChange={handleChange}
                   onKeyDown={handleKeyDown}
                   label={'Password'}
                   inputProps={{ type: 'password', autoComplete: 'current-password' }}/>
      </Stack>
      <LoginErrorAlert sx={{ mt: 2 }} error={state?.loginError || error}/>
      <Link href="https://www.reddit.com/r/idleon/comments/12ccw2h/steam_email/" target="_blank" rel="noopener"
            variant="body2" sx={{ mt: 2, alignSelf: 'flex-start' }}>
        Forgot which email you used?
      </Link>
      <FlowAction onClick={handleSubmit} loading={waitingForAuth}>Sign in</FlowAction>
    </Stack>
  );
};


export default EmailLogin;
