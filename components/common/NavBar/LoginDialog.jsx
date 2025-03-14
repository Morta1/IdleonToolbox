import { Dialog, DialogContent, DialogTitle, Link, Stack, Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import React, { useContext, useState } from 'react';
import PasswordIcon from '@mui/icons-material/Password';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Switch from '../Switch';
import EmailLogin from '../Logins/EmailLogin';
import GoogleLogin from '../Logins/GoogleLogin';
import AppleLogin from '../Logins/AppleLogin';
import { AppContext } from '../context/AppProvider';
import SteamLogin from '@components/common/Logins/SteamLogin';
import { prefix } from 'utility/helpers';

const methods = [
  { name: 'email', icon: <PasswordIcon/> },
  { name: 'gmail', icon: <GoogleIcon/> },
  { name: 'apple', icon: <AppleIcon/> },
  { name: 'steam', icon: <img width={24} height={24} src={`${prefix}etc/steam-icon.png`} alt={'steam-icon'}/> }
]
const LoginDialog = ({ open, setOpen, onClose }) => {
  const { dispatch, setWaitingForAuth, waitingForAuth } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(0);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });

  const handleTabChange = (e, selected) => {
    setSelectedTab(selected);
    dispatch({ type: 'loginError', data: '' })
    setWaitingForAuth(false);
  }

  const handleClose = () => {
    setSelectedTab(0);
    dispatch({ type: 'loginError', data: '' });
    setWaitingForAuth(false);
    onClose();
  }

  return <Dialog fullWidth={true} maxWidth={'sm'} open={open} onClose={handleClose}>
    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Stack>
        <Typography variant={'h6'}>Login</Typography>
        <Typography variant={'body2'}>Use the same credentials as your idleon account</Typography>
        <Link sx={{ fontSize: 14, width: 'fit-content' }}
              href={'https://www.reddit.com/r/idleon/comments/12ccw2h/steam_email/'}
              target={'_blank'}>Can't remember
          your email?</Link>
      </Stack>
      <IconButton onClick={handleClose}><CloseIcon/></IconButton>
    </DialogTitle>
    <DialogContent>
      <Tabs centered
            sx={{ marginBottom: 3 }}
            variant={'fullWidth'}
            value={selectedTab} onChange={handleTabChange}>
        {methods.map(({ name, icon }, index) => {
          return <Tab disabled={waitingForAuth} iconPosition={isSm ? 'top' : 'start'} label={name.capitalize()} icon={icon}
                      key={`${name}-${index}`}/>;
        })}
      </Tabs>
      <Switch selected={selectedTab}>
        <EmailLogin switch-id={0}/>
        <GoogleLogin switch-id={1}/>
        <AppleLogin switch-id={2}/>
        <SteamLogin switch-id={3} setOpen={setOpen}/>
      </Switch>
    </DialogContent>
  </Dialog>
};

export default LoginDialog;
