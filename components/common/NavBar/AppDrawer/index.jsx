import Box from '@mui/material/Box';
import React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import { drawerWidth, navBarHeight, profileBannerHeight } from '../../../constants';
import Toolbar from '@mui/material/Toolbar';
import { useRouter } from 'next/router';
import AccountDrawer from './AccountDrawer';
import ToolsDrawer from './ToolsDrawer';
import { shouldDisplayDrawer } from '@utility/helpers';
import useProfileBannerState from '@hooks/useProfileBannerState';

// The permanent drawer beside account and tool pages from lg, its last job (the phone has PhoneMenu); the sticky
// app bar stands in the flow above it.
const AppDrawer = () => {
  const router = useRouter();
  const { isVisible: showProfileBanner } = useProfileBannerState();

  const getDrawer = () => {
    if (router.pathname.includes('/account')) {
      return <AccountDrawer/>
    } else if (router.pathname.includes('/tools')) {
      return <ToolsDrawer/>
    }
    return null;
  }

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
};


const StyledDrawer = styled(Drawer)(() => ({
  display: { xs: 'block', sm: 'none' },
  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
  '& .MuiPaper-root': { backgroundImage: 'none' }
}))

export default AppDrawer;
