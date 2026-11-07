import { useState } from 'react';
import { Box } from '@mui/material';
import { IconLogin2 } from '@tabler/icons-react';
import Button from '@mui/material/Button';
import LoginDialog from './LoginDialog';

const LoginButton = () => {
  const [open, setOpen] = useState(false);
  // nowrap: "Sign in" is two words, and the app bar squeezes this box before anything else on a phone.
  return <Box sx={{ flexShrink: 0 }}>
    <Button sx={{ color: 'text.primary', whiteSpace: 'nowrap' }} onClick={() => setOpen(true)}
            startIcon={<IconLogin2/>}>Sign in</Button>
    <LoginDialog open={open} onClose={() => setOpen(false)}/>
  </Box>;
};

export default LoginButton;
