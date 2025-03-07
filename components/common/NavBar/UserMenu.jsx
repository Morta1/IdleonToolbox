import { IconLogin2, IconLogout2, IconUserCircle } from '@tabler/icons-react';
import IconButton from '@mui/material/IconButton';
import {
  Box,
  Divider,
  listClasses,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  Stack,
  Typography
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { format } from 'date-fns';
import LoginDialog from '@components/common/NavBar/LoginDialog';
import { useRouter } from 'next/router';

const UserMenu = () => {
  const { state, logout, dispatch } = useContext(AppContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const { profile, ...queryParams } = router.query;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    setDialogOpen(false);
    handleClose()
  }, [state?.signedIn]);

  const handleLogout = () => {
    logout();
  }

  const handleBackToAccount = () => {
    router.push({ url: router.pathname, query: queryParams });
    setTimeout(() => router.reload())
  }

  return <>
    <IconButton onClick={handleClick}
                size="small"
                sx={{ ml: 1 }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}>
      <IconUserCircle size={28}/>
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
      {state?.profile && !state.signedIn ? <MenuItem onClick={() => setDialogOpen(true)}>
        <ListItemIcon><IconLogin2/></ListItemIcon>
        <ListItemText>Login</ListItemText>
      </MenuItem> : state.profile && state.signedIn ? <MenuItem onClick={handleBackToAccount}>
        <ListItemIcon><IconLogout2/></ListItemIcon>
        <ListItemText>Back to my account</ListItemText>
      </MenuItem> : <MenuItem onClick={handleLogout}>
        <ListItemIcon><IconLogout2/></ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>}
    </Menu>
    <LoginDialog open={dialogOpen} setOpen={setDialogOpen} onClose={() => setDialogOpen(false)}/>
  </>
};

export default UserMenu;
