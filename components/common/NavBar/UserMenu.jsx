import { IconCopy, IconDatabase, IconLogin2, IconLogout2, IconSettings, IconUser } from '@tabler/icons-react';
import IconButton from '@mui/material/IconButton';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Divider, listClasses, ListItemIcon, ListItemText, Menu
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import LoginDialog from '@components/common/NavBar/LoginDialog';
import { useRouter } from 'next/router';
import { IconClipboard } from '@tabler/icons-react';
import { handleLoadJson, isProd, sortKeys } from '@utility/helpers';
import { expandLeaderboardInfo } from '../../../services/profiles';

const UserMenu = () => {
  const { dispatch, state, logout } = useContext(AppContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [prevSignedIn, setPrevSignedIn] = useState(state?.signedIn);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const { profile, ...queryParams } = router.query;

  if (state?.signedIn !== prevSignedIn) {
    setPrevSignedIn(state?.signedIn);
    setDialogOpen(false);
    setAnchorEl(null);
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCopyForSupport = async () => {
    try {
      const data = JSON.parse(sessionStorage.getItem('rawJson'));
      const extraData = expandLeaderboardInfo(state?.account, state?.characters);
      await navigator.clipboard.writeText(JSON.stringify(sortKeys({ ...data, extraData }), null, 2));
    } catch (err) {
      console.error(err);
    }
    handleClose();
  };

  const handleCopyRawData = async () => {
    try {
      const data = JSON.parse(sessionStorage.getItem('rawJson'));
      await navigator.clipboard.writeText(JSON.stringify(sortKeys(data?.data), null, 2));
    } catch (err) {
      console.error(err);
    }
    handleClose();
  };

  const handleLogout = () => {
    handleClose();
    setLogoutConfirmOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    logout();
  };

  const handleBackToAccount = () => {
    router.push({ url: router.pathname, query: queryParams });
    setTimeout(() => router.reload())
  }

  return <>
    <IconButton onClick={handleClick}
                size="small"
                sx={{
                  ml: 1, flexShrink: 0,
                  width: 'fit-content',
                  border: '1px solid rgba(255, 255, 255, 0.23)',
                  borderRadius: '16px',
                  height: '32px',
                  padding: '4px 8px'
                }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}>
      <IconUser stroke={'grey'} size={16}/>
      {/*<IconChevronDown size={14} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}/>*/}
    </IconButton>
    <Menu
      anchorEl={anchorEl}
      id="account-menu"
      open={open}
      onClose={handleClose}
      sx={{
        [`.${listClasses.root}`]: {
          pt: 0
        }
      }}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            mt: 1,
            border: '1px solid #424242',
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px'
          }
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ mb: 1 }}/>
      <MenuItem onClick={() => {
        router.push({ pathname: '/settings', query: router.query });
        handleClose();
      }}>
        <ListItemIcon><IconSettings/></ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>
      {(state?.signedIn || state?.profile || state?.manualImport) ? [
        <Divider key="copy-divider"/>,
        <MenuItem key="copy-support" onClick={handleCopyForSupport}>
          <ListItemIcon><IconCopy/></ListItemIcon>
          <ListItemText>Copy for support</ListItemText>
        </MenuItem>,
        <MenuItem key="copy-raw" onClick={handleCopyRawData}>
          <ListItemIcon><IconDatabase/></ListItemIcon>
          <ListItemText>Copy raw data</ListItemText>
        </MenuItem>
      ] : null}
      {!isProd ? <>
        <Divider/>
        <MenuItem onClick={async () => { await handleLoadJson(dispatch); handleClose(); }}>
          <ListItemIcon><IconClipboard/></ListItemIcon>
          <ListItemText>Paste data</ListItemText>
        </MenuItem>
      </> : null}
      <Divider sx={{ my: 1 }}/>
      {state?.profile && !state.signedIn ? <MenuItem onClick={() => setDialogOpen(true)}>
        <ListItemIcon><IconLogin2/></ListItemIcon>
        <ListItemText>Login</ListItemText>
      </MenuItem> : state.profile && state.signedIn ? <MenuItem onClick={handleBackToAccount}>
        <ListItemIcon><IconLogout2/></ListItemIcon>
        <ListItemText>Back to my account</ListItemText>
      </MenuItem> : <MenuItem sx={{ color: 'error.light' }} onClick={handleLogout}>
        <ListItemIcon sx={{ color: 'inherit' }}><IconLogout2/></ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>}
    </Menu>
    <LoginDialog open={dialogOpen} setOpen={setDialogOpen} onClose={() => setDialogOpen(false)}/>
    <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)}>
      <DialogTitle>Logout</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to logout?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setLogoutConfirmOpen(false)}>Cancel</Button>
        <Button color="error" onClick={handleLogoutConfirm}>Logout</Button>
      </DialogActions>
    </Dialog>
  </>
};

export default UserMenu;
