import React, { useContext, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import { AppContext } from '../context/AppProvider';
import LoginDialog from './LoginDialog';

const LoginButton = () => {
  const { state, logout } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [state?.signedIn])

  const handleLogin = () => {
    setOpen(true);
  }

  const handleLogout = () => {
    logout();
  }

  return <Box sx={{ marginLeft: 'auto' }}>
    {!state?.signedIn ? <Button sx={{ color: 'white', '&:hover': { borderColor: 'white' } }}
                                onClick={handleLogin}
                                startIcon={<LoginIcon/>}>Login</Button> :
      <Button sx={{ color: 'white', '&:hover': { borderColor: 'white' } }}
              onClick={handleLogout}
              startIcon={<LogoutIcon/>}>Logout</Button>}
    <LoginDialog open={open} setOpen={setOpen} onClose={() => setOpen(false)}/>
  </Box>
};


export default LoginButton;
