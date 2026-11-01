import React, { useContext, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { IconLogin2 } from '@tabler/icons-react';
import Button from '@mui/material/Button';
import { AppContext } from '../context/AppProvider';
import LoginDialog from './LoginDialog';

const LoginButton = () => {
  const { state } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [state?.signedIn])

  const handleLogin = () => {
    setOpen(true);
  }

  // nowrap: "Sign in" is two words, and the app bar squeezes this box before anything else on a phone.
  return <Box sx={{ flexShrink: 0 }}>
    <Button sx={{ color: 'white', whiteSpace: 'nowrap', '&:hover': { borderColor: 'white' } }}
            onClick={handleLogin}
            startIcon={<IconLogin2/>}>Sign in</Button>
    <LoginDialog open={open} setOpen={setOpen} onClose={() => setOpen(false)}/>
  </Box>
};


export default LoginButton;
