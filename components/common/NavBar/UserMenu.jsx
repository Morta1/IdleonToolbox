import { IconClipboard, IconLogout2, IconUserCircle } from '@tabler/icons-react';
import IconButton from '@mui/material/IconButton';
import {
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
import { handleLoadJson, isProd } from '@utility/helpers';

const UserMenu = () => {
  const { state, logout } = useContext(AppContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    setDialogOpen(false);
  }, [state?.signedIn]);

  const handleLogout = () => {
    logout();
  }

  return <>
    <IconButton onClick={handleClick}
                size="small"
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
      <ListSubheader>
        <Stack sx={{ p: 1 }}>
          <Typography variant={'body1'}>{state?.characters?.[0]?.name || 'Placeholder'}</Typography>
          <Typography variant={'caption'}>Updated: {state?.lastUpdated
            ? format(state?.lastUpdated, 'dd/MM/yyyy HH:mm:ss')
            : 'XX/XX/XXXX XX:XX:XX'}</Typography>
        </Stack>
      </ListSubheader>
      <Divider sx={{ mb: 1 }}/>
      {/*<MenuItem onClick={handleClose}>*/}
      {/*  <ListItemIcon>*/}
      {/*    <IconSun/>*/}
      {/*  </ListItemIcon>*/}
      {/*  Dark Mode*/}
      {/*</MenuItem>*/}
      <MenuItem onClick={handleLogout}>
        <ListItemIcon><IconLogout2/></ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
    <LoginDialog open={dialogOpen} setOpen={setDialogOpen} onClose={() => setDialogOpen(false)}/>
  </>
};

export default UserMenu;
