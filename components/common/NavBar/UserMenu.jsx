import { IconCopy, IconDatabase, IconLogin2, IconLogout2, IconSettings, IconUser } from '@tabler/icons-react';
import IconButton from '@mui/material/IconButton';
import { Divider, ListItemIcon, ListItemText, Menu, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import LoginDialog from '@components/common/NavBar/LoginDialog';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { IconClipboard } from '@tabler/icons-react';
import { copyForSupport, copyRawData, handleLoadJson, isProd } from '@utility/helpers';
import { CLIPBOARD_ERROR_MESSAGE } from '@utility/clipboard';
import { sessionQuery, sessionQueryWithoutProfile } from '@utility/nav-query';
import { notify } from '@components/common/Overlays/notify';
import AppDialog from '@components/common/Overlays/AppDialog';
import useFormatDate from '@hooks/useFormatDate';
import { MenuCaption, TourMenu, useThemeRows, useTourMenu } from '@components/common/NavBar/ThemeRows';

const UserMenu = () => {
  const { dispatch, state, logout } = useContext(AppContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [button, setButton] = useState(null);
  const tourOpen = useTourMenu('user');
  const [prevSignedIn, setPrevSignedIn] = useState(state?.signedIn);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const queryParams = sessionQueryWithoutProfile(router.query);
  const formatDate = useFormatDate();
  const createdAt = (state?.signedIn || state?.profile) ? state?.account?.accountCreateTime : null;

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
  const themeRows = useThemeRows(handleClose);

  const runCopy = async (copy, successMessage) => {
    let copied = false;
    let failure = CLIPBOARD_ERROR_MESSAGE;
    try {
      copied = await copy();
    } catch (err) {
      // copyText never throws, so this is the data build failing, not the clipboard
      console.error(err);
      failure = `Couldn't prepare the data to copy: ${err?.message || err}`;
    }
    handleClose();
    notify(copied ? successMessage : failure);
  };

  const handleCopyForSupport = async () => {
    await runCopy(() => copyForSupport(state?.account, state?.characters), 'Copied to clipboard');
  };

  const handleCopyRawData = async () => {
    await runCopy(() => copyRawData(), 'Copied to clipboard');
  };

  const handleLogout = () => {
    handleClose();
    setLogoutConfirmOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    logout();
  };

  // A pasted save replaces a signed-in session, or the session's next update would replace the save.
  const handlePasteData = async () => {
    const imported = await handleLoadJson(dispatch);
    if (imported && state?.signedIn) logout(true, { signedIn: false });
    handleClose();
  };

  const handleBackToAccount = () => {
    router.push({ url: router.pathname, query: queryParams });
    setTimeout(() => router.reload())
  }

  const rows = [
    createdAt ? <MenuCaption key="created">{`Account created ${formatDate(createdAt, { showSeconds: false })}`}</MenuCaption> : null,
    ...themeRows,
    <Divider key="theme-divider"/>,
    <MenuItem key="settings" component={NextLink} href={{ pathname: '/settings', query: sessionQuery(router.query) }} onClick={handleClose}>
      <ListItemIcon><IconSettings/></ListItemIcon>
      <ListItemText>Settings</ListItemText>
    </MenuItem>,
    ...((state?.signedIn || state?.profile || state?.manualImport) ? [
      <Divider key="copy-divider"/>,
      <MenuItem key="copy-support" onClick={handleCopyForSupport}>
        <ListItemIcon><IconCopy/></ListItemIcon>
        <ListItemText>Copy for support</ListItemText>
      </MenuItem>,
      <MenuItem key="copy-raw" onClick={handleCopyRawData}>
        <ListItemIcon><IconDatabase/></ListItemIcon>
        <ListItemText>Copy raw data</ListItemText>
      </MenuItem>
    ] : []),
    ...(!isProd ? [
      <Divider key="paste-divider"/>,
      <MenuItem key="paste-data" onClick={handlePasteData}>
        <ListItemIcon><IconClipboard/></ListItemIcon>
        <ListItemText>Paste data</ListItemText>
      </MenuItem>
    ] : []),
    <Divider key="session-divider"/>,
    !state?.signedIn ? (
      <MenuItem key="session" onClick={() => {
        handleClose();
        setDialogOpen(true);
      }}>
        <ListItemIcon><IconLogin2/></ListItemIcon>
        <ListItemText>Sign in</ListItemText>
      </MenuItem>
    ) : state.profile ? (
      <MenuItem key="session" onClick={handleBackToAccount}>
        <ListItemIcon><IconLogout2/></ListItemIcon>
        <ListItemText>Back to my account</ListItemText>
      </MenuItem>
    ) : (
      <MenuItem key="session" sx={{ color: 'text.error' }} onClick={handleLogout}>
        <ListItemIcon sx={{ color: 'inherit' }}><IconLogout2/></ListItemIcon>
        <ListItemText>Log out</ListItemText>
      </MenuItem>
    )
  ];

  return <>
    <IconButton ref={setButton} data-tour="user-menu" onClick={handleClick}
                aria-label={'Account menu'}
                size="small"
                sx={{
                  ml: 1, flexShrink: 0,
                  width: 'fit-content',
                  border: 1,
                  borderColor: 'outline',
                  borderRadius: '16px',
                  height: '32px',
                  padding: '4px 8px'
                }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}>
      <IconUser color={'var(--mui-palette-text-secondary)'} size={16}/>
      {/*<IconChevronDown size={14} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}/>*/}
    </IconButton>
    <Menu
      anchorEl={anchorEl}
      id="account-menu"
      open={open}
      onClose={handleClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      // Past the theme's 360 px, which put the last row behind a scroll: only a window too short for the menu scrolls it.
      slotProps={{ paper: { sx: { maxHeight: 'calc(100% - 32px)' } } }}
    >
      {rows}
    </Menu>
    {tourOpen ? <TourMenu anchorEl={button} placement="bottom-end">{rows}</TourMenu> : null}
    <LoginDialog open={dialogOpen} onClose={() => setDialogOpen(false)}/>
    <AppDialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} size="s" title="Log out?"
               actions={[{ label: 'Cancel' }, { label: 'Log out', main: true, onClick: handleLogoutConfirm }]}>
      <Typography color="text.secondary">You can sign in again at any time.</Typography>
    </AppDialog>
  </>
};

export default UserMenu;
