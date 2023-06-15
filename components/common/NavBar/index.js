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
import { isProd, shouldDisplayDrawer } from '../../../utility/helpers';
import { Adsense } from '@ctrl/react-adsense';
import { useMediaQuery } from '@mui/material';
import { parseData } from '../../../parsers';
import { AppContext } from '../context/AppProvider';
import IconButton from '@mui/material/IconButton';
import FileCopyIcon from '@mui/icons-material/FileCopy';

const NavBar = ({ children }) => {
  const {  dispatch } = useContext(AppContext);
  const router = useRouter();
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const displayDrawer = shouldDisplayDrawer(router?.pathname);

  const handlePaste = async () => {
    try {
      const content = JSON.parse(await navigator.clipboard.readText());
      const { data, charNames, guildData, serverVars } = content;
      const parsedData = parseData(data, charNames, guildData, serverVars);
      const lastUpdated = new Date().getTime();
      localStorage.setItem('lastUpdated', JSON.stringify(lastUpdated));
      console.log('Manual Import', { ...parsedData, lastUpdated, manualImport: true });
      dispatch({ type: 'data', data: { ...parsedData, lastUpdated, manualImport: true } });
    } catch (e) {
      console.error('Error while trying to manual import', e);
    }
  }

  return <>
    <Box sx={{ display: 'flex' }}>
      <AppBar compopnent={'nav'}>
        <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}>
          <AppDrawer/>
          <NavItemsList/>
          {!isProd ? <IconButton color="inherit" onClick={handlePaste}>
            <FileCopyIcon/>
          </IconButton> : null}
          <LoginButton/>
        </Toolbar>
      </AppBar>
    </Box>
    <AppDrawer permanent/>
    <Box
      sx={{
        pt: 3,
        pr: 3,
        pl: { xs: 3, lg: displayDrawer ? `${drawerWidth + 24}px` : 3 },
        mb: isXs ? '75px' : '110px'
      }}
      component={'main'}>
      {children}
    </Box>
    <Box style={{
      backgroundColor: isProd ? '' : '#d73333',
      position: 'fixed',
      bottom: 0,
      left: { xs: 'inherit', lg: displayDrawer ? drawerWidth : 3 },
      width: '100%'
    }}>
      <Adsense
        style={{
          display: 'block',
          height: isXs ? 50 : 90,
          maxHeight: isXs ? 50 : 90,
          maxWidth: 1200,
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
