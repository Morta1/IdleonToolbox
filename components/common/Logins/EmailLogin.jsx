import { Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useState } from 'react';
import { signInWithEmailPassword } from '../../../firebase';
import { AppContext } from '../context/AppProvider';

const EmailLogin = () => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setSubmitted(false);
    setError('');
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
        data = await signInWithEmailPassword({ email, password });
        dispatch({ type: 'login', data: { loginData: data, loginType: 'email' } })
      } catch (error) {
        setWaitingForAuth(false);
        dispatch({ type: 'loginError', data: error?.message })
      }
    } else {
      setError('Please enter valid email and password');
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
      {(state?.loginError || error) ? <Card raised sx={{bgcolor: '#c02222'}}>
        <CardContent >
          <Typography variant={'body1'}>{state?.loginError || error}</Typography>
        </CardContent>
      </Card> : null}
    </Stack>
  );
};


export default EmailLogin;
