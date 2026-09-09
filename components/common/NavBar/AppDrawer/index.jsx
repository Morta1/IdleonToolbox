import Box from '@mui/material/Box';
import React, { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import { drawerWidth, navBarHeight, profileBannerHeight } from '../../../constants';
import Toolbar from '@mui/material/Toolbar';
import NavItemsList from '../NavItemsList';
import { useRouter } from 'next/router';
import { NextLinkComposed } from '../../NextLinkComposed';
import Link from '@mui/material/Link';
import { Divider, Stack } from '@mui/material';
import AccountDrawer from './AccountDrawer';
import CharactersDrawer from './CharactersDrawer';
import ToolsDrawer from './ToolsDrawer';
import { prefix, shouldDisplayDrawer } from '@utility/helpers';
import useProfileBannerState from '@hooks/useProfileBannerState';
import { sessionQuery } from '@utility/nav-query';

const AppDrawer = ({ permanent }) => {
  const router = useRouter();
  const { isVisible: showProfileBanner } = useProfileBannerState();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  const toggleDrawer = (event, open) => {
    setOpen(!open);
  };

  const getDrawer = () => {
    if (router.pathname.includes('/account')) {
      return <AccountDrawer/>
    } else if (router.pathname.includes('/characters')) {
      return <CharactersDrawer/>
    } else if (router.pathname.includes('/tools')) {
      return <ToolsDrawer/>
    }
    return null;
  }

  return <Box component={'nav'} sx={{ display: 'flex', alignItems: 'center', height: navBarHeight }}>
    <IconButton onClick={(e) => toggleDrawer(e, open)}
                aria-label="open drawer" edge="start"
                sx={{ mr: 2, display: { xs: 'inherit', lg: 'none' } }}>
      <MenuIcon/>
    </IconButton>
    {!permanent ? <Stack>
      <Link to={{ pathname: '/', query: sessionQuery(router.query) }}
            underline="none" component={NextLinkComposed}
            sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            color="inherit" noWrap variant={'h6'}
      >
        <img src={`${prefix}data/Coins5.png`} alt="Coins5"/>
        {/* Two spans toggled by CSS rather than one span fed by a media query: the export and
            the first client render must agree, and CSS needs no JS to be right. */}
        <Box component={'span'} sx={{ display: { xs: 'none', sm: 'inline' } }}>Idleon Toolbox</Box>
        <Box component={'span'} sx={{ display: { xs: 'inline', sm: 'none' } }}>IT</Box>
      </Link>
    </Stack> : null}
    {permanent ? <StyledDrawer variant={'permanent'} open sx={{ // desktop
      display: shouldDisplayDrawer(router.pathname) ? {
        xs: 'none',
        lg: 'inherit'
      } : 'none'
    }}>
      <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}/>
      {showProfileBanner ? <Box sx={{ height: profileBannerHeight }}/> : null}
      {getDrawer()}
    </StyledDrawer> : <StyledDrawer // mobile
      sx={{ display: { xs: 'inherit', lg: 'none' } }}
      anchor={'left'}
      open={open}
      onClose={() => setOpen(false)}
    >
      <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}/>
      {showProfileBanner ? <Box sx={{ height: profileBannerHeight }}/> : null}
      <NavItemsList drawer/>
      {router.pathname.includes('/characters') ? <>
        <Divider/>
        <CharactersDrawer/>
      </> : null}
    </StyledDrawer>}
  </Box>
};


const StyledDrawer = styled(Drawer)(() => ({
  display: { xs: 'block', sm: 'none' },
  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
  '& .MuiPaper-root': { backgroundImage: 'none' }
}))

export default AppDrawer;
