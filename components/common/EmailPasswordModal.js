import { Dialog, DialogContent, Stack, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import React, { useState } from "react";

const EmailPasswordDialog = ({ open, handleClick, handleClose, loginError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleLogin = () => {
    setSubmitted(true);
    if (email && password) {
      typeof handleClick === 'function' && handleClick({ email, password })
    }
  }

  const handleChange = (e) => {
    setSubmitted(false);
    const funcName = e.target.name === 'email' ? setEmail : setPassword;
    funcName(e.target.value);
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Stack gap={3}>
          <TextField autoComplete={'off'} value={email} error={submitted && !email} name={'email'} onChange={handleChange} label={'Email'}/>
          <TextField autoComplete={'off'} value={password} error={submitted && !password} name={'password'} onChange={handleChange}
                     label={'Password'}
                     inputProps={{ type: 'password' }}/>
          <Button onClick={handleLogin} variant={'contained'}>Login</Button>

          {loginError ? <Typography color={'error'} variant={"body1"}>{loginError}</Typography> : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPasswordDialog;
