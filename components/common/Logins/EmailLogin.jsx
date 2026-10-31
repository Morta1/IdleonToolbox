import { Stack, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useState } from 'react';
import { loadFirebase } from '../../../firebase/lazy';
import { AppContext } from '../context/AppProvider';
import { describeLoginError, toLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';

const EmailLogin = () => {
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
    if (e.code === 'Enter') {
      await handleSubmit();
    }
  }

  const handleSubmit = async () => {
    setSubmitted(true);
    if (email && password) {
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
    <Stack gap={3}>
      <TextField inputProps={{ autoComplete: 'off' }} value={email} error={submitted && !email} name={'email'}
                 onChange={handleChange}
                 onKeyDown={handleKeyDown}
                 label={'Email'}/>
      <TextField value={password} error={submitted && !password} name={'password'}
                 onChange={handleChange}
                 onKeyDown={handleKeyDown}
                 label={'Password'}
                 inputProps={{ type: 'password', autoComplete: 'off' }}/>
      <Button 
        onClick={handleSubmit} 
        loading={waitingForAuth} 
        variant={'contained'}
      >
        Login
      </Button>
      <LoginErrorAlert error={state?.loginError || error}/>
    </Stack>
  );
};


export default EmailLogin;
