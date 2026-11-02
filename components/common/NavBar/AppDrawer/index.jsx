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
import { Divider } from '@mui/material';
import AccountDrawer from './AccountDrawer';
import CharactersDrawer from './CharactersDrawer';
import ToolsDrawer from './ToolsDrawer';
import { shouldDisplayDrawer } from '@utility/helpers';
import useProfileBannerState from '@hooks/useProfileBannerState';
import NoticeSlot from '@components/common/Overlays/NoticeSlot';

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

  // The permanent drawer is fixed beside the page from lg; the sticky app bar stands in the flow above it.
  if (permanent) {
    return <StyledDrawer variant={'permanent'} open sx={{
      display: shouldDisplayDrawer(router.pathname) ? {
        xs: 'none',
        lg: 'inherit'
      } : 'none'
    }}>
      <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}/>
      {showProfileBanner ? <Box sx={{ height: profileBannerHeight }}/> : null}
      {getDrawer()}
    </StyledDrawer>;
  }

  return <Box sx={{ display: 'flex', alignItems: 'center', height: navBarHeight }}>
    <IconButton onClick={(e) => toggleDrawer(e, open)}
                aria-label="Open menu" edge="start"
                sx={{ mr: 2, display: { xs: 'inherit', lg: 'none' } }}>
      <MenuIcon/>
    </IconButton>
    <StyledDrawer // mobile
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
      {/* The open drawer is a modal: a notice from inside it (a pinned pages import) is heard here */}
      <NoticeSlot open={open}/>
    </StyledDrawer>
  </Box>
};


const StyledDrawer = styled(Drawer)(() => ({
  display: { xs: 'block', sm: 'none' },
  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
  '& .MuiPaper-root': { backgroundImage: 'none' }
}))

export default AppDrawer;
