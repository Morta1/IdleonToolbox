import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import NavItemsList from './NavItemsList';
import LoginButton from './LoginButton';
import AppDrawer from './AppDrawer';
import { drawerWidth, navBarHeight } from '../../constants';
import { useRouter } from 'next/router';
import { handleLoadJson, isProd, shouldDisplayDrawer } from '../../../utility/helpers';
import { Adsense } from '@ctrl/react-adsense';
import { Stack, Typography, useMediaQuery } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import AdBlockerPopup from '@components/common/AdBlockerPopup';
import Pin from '@components/common/favorites/Pin';
import QuickSearch from '@components/common/QuickSearch';
import UserMenu from '@components/common/NavBar/UserMenu';
import { format } from 'date-fns';
import IconButton from '@mui/material/IconButton';
import FileCopyIcon from '@mui/icons-material/FileCopy';

const NavBar = ({ children }) => {
  const { dispatch, state } = useContext(AppContext);
  const router = useRouter();
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const displayDrawer = shouldDisplayDrawer(router?.pathname);

  const handlePaste = async () => {
    await handleLoadJson(dispatch);
  }

  return <>
    <Box sx={{ display: 'flex' }}>
      <AppBar compopnent={'nav'}>
        <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}>
          <AppDrawer/>
          <NavItemsList/>
          <QuickSearch/>
          {!isProd ? <IconButton data-cy={'paste-data'} color="inherit" onClick={handlePaste}>
            <FileCopyIcon/>
          </IconButton> : null}
          {state?.signedIn || state?.profile ? <UserMenu/> : <LoginButton/>}
          {state?.signedIn ? <Stack sx={{ p: 1, width: 120, flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: 14 }}>{state?.characters?.[0]?.name}</Typography>
              {state?.lastUpdated ? <Typography variant={'caption'}>{state?.lastUpdated
                  ? format(state?.lastUpdated, 'dd/MM/yy HH:mm')
                  : 'xx/xx/xx xx:xx'}</Typography>
                : null}
            </Stack>
            : null}
        </Toolbar>
      </AppBar>
    </Box>
    <AppDrawer permanent/>
    <AdBlockerPopup/>
    <Box component={'main'} sx={{
      pt: 3,
      pr: 3,
      pl: { xs: 3, lg: displayDrawer ? `${drawerWidth + 24}px` : 3 },
      mb: isXs ? '75px' : '110px'
    }}>
      {(router?.pathname?.includes('account') || router?.pathname?.includes('tools')) ? <Pin/> : null}
      {children}
    </Box>
    <Box
      key={router?.pathname}
      style={{
        backgroundColor: isProd ? '' : '#d73333',
        position: 'fixed',
        bottom: 0,
        left: { xs: 'inherit', lg: displayDrawer ? drawerWidth : 3 },
        width: '100%'
      }}>
      <Adsense
        style={{
          display: 'block',
          marginLeft: drawerWidth,
          height: isXs ? 50 : 90,
          maxHeight: isXs ? 50 : 90,
          margin: '0 auto'
        }}
        client="ca-pub-1842647313167572"
        slot="1488341218"
        format={''}
      />
    </Box>
  </>
};

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open'
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));

export default NavBar;
