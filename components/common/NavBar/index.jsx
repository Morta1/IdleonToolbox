import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import NavItemsList from './NavItemsList';
import LoginButton from './LoginButton';
import AppDrawer from './AppDrawer';
import { drawerWidth, navBarHeight } from '../../constants';
import { useRouter } from 'next/router';
import { shouldDisplayDrawer } from '@utility/helpers';
import { Link, Stack, Typography } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import AdBlockerPopup from '@components/common/AdBlockerPopup';
import Pin from '@components/common/favorites/Pin';
import PageTitle from '@components/common/PageTitle';
import QuickSearch from '@components/common/QuickSearch';
import UserMenu from '@components/common/NavBar/UserMenu';

import useFormatDate from '@hooks/useFormatDate';
import { CONTENT_PERCENT_SIZE } from '@utility/consts';
import AuthSkeleton from './AuthSkeleton';
import { BottomBannerAd, SidebarAd } from '@components/common/Ads/AdUnit';
import { useSidebarAdBlocked } from '@hooks/useSidebarAd';
import usePageDataLoading from '@hooks/usePageDataLoading';
import PageLoadingProvider, { usePageLoadingState } from '@components/common/context/PageLoadingProvider';
import ProfileBanner from './ProfileBanner';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';

const NavBar = ({ children }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const displayDrawer = shouldDisplayDrawer(router?.pathname);
  const pathname = router?.pathname || '';
  const isHomePage = pathname === '/' || pathname === '';
  const isInnerPage = !isHomePage && pathname !== '/patch-notes';
  const [openPolicy, setOpenPolicy] = useState(false);
  const formatDate = useFormatDate();

  // Render the authentication section based on loading state
  const renderAuthSection = () => {
    if (state.isLoading) {
      return <AuthSkeleton/>;
    }

    return (
      <>
        {!state?.signedIn && !state?.profile && process.env.NODE_ENV !== 'production' && <UserMenu/>}
        {state?.signedIn || state?.profile ? <UserMenu/> : <LoginButton/>}
        {state?.signedIn ? (
          <Stack sx={{ p: 1, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: 14 }}>{state?.characters?.[0]?.name}</Typography>
            {state?.lastUpdated ? (
              <Typography variant={'caption'}>
                {formatDate(state?.lastUpdated, { showSeconds: false, shortYear: true })}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </>
    );
  };

  return <PageLoadingProvider>
    <Box sx={{ display: 'flex' }}>
      <AppBar compopnent={'nav'}>
        <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}>
          <AppDrawer/>
          <NavItemsList/>
          <QuickSearch/>
{renderAuthSection()}
        </Toolbar>
      </AppBar>
    </Box>
    <AppDrawer permanent/>
    <AdBlockerPopup/>
    <ProfileBanner/>
    <Box component={'main'} sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: `calc(100vh - ${navBarHeight}px)`,
      pt: 3,
      pr: 3,
      pl: { xs: 3, lg: displayDrawer ? `${drawerWidth + 24}px` : 3 },
      pb: 'var(--nitro-ad-height, 0px)'
    }}>
      <Box sx={{ flex: 1 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'} sx={{ mb: 1 }}>
          <PageTitle/>
          {(router?.pathname?.includes('account') || router?.pathname?.includes('tools')) ? <Pin/> : null}
        </Stack>
        <ContentWrapper showSidebar={isInnerPage}>
          {children}
        </ContentWrapper>
      </Box>
      <Stack direction="row" justifyContent="center" alignItems="center" gap={1}
             divider={<Typography color="text.secondary" variant="caption">&middot;</Typography>}
             sx={{
               mt: 4,
               py: 1.5,
               borderTop: '1px solid',
               borderColor: 'divider',
               backgroundColor: 'background.paper'
             }}>
        <Link href="https://discord.gg/8Devcj7FzV" target="_blank" rel="noopener"
              variant="caption" color="text.secondary">
          Discord
        </Link>
        <Link href="https://ko-fi.com/S6S7BHLQ4" target="_blank" rel="noopener"
              variant="caption" color="text.secondary">
          Buy me a coffee
        </Link>
        <Link component="button" variant="caption" color="text.secondary"
              sx={{ cursor: 'pointer' }}
              onClick={() => setOpenPolicy(true)}>
          Cookie Policy
        </Link>
      </Stack>
      <CookiePolicyDialog open={openPolicy} onClose={() => setOpenPolicy(false)}/>
    </Box>
    <BottomBannerAd displayDrawer={displayDrawer}/>
  </PageLoadingProvider>
};

const ContentWrapper = ({ showSidebar, children }) => {
  const adBlocked = useSidebarAdBlocked();
  const { loading } = usePageDataLoading();
  const pageReportedLoading = usePageLoadingState();

  if (!showSidebar) return children;

  // While the page is waiting for data there is nothing to keep clear of the fixed rail ad, and a
  // reserved gutter would push the loader ~165px left of the viewport centre with an empty 300px
  // void beside it. SidebarAd stays mounted through the collapse so the ad is never recreated.
  //
  // The 850px breakpoint lives in CSS, not in a media query hook: a hook is false at build and on
  // the first client render, so the export would ship a full-width column that jumps to 85% one
  // render later. Adblock detection cannot be done in CSS and starts as "not blocked", so the
  // export reserves the gutter and only adblock users see a collapse rather than an expansion.
  const reserve = !adBlocked && !loading && !pageReportedLoading;

  return (
    <Stack direction={'row'} justifyContent={'space-between'}
           sx={{ width: '100%', minWidth: 0, gap: 0, '@media (min-width: 850px)': { gap: reserve ? 2 : 0 } }}>
      <Stack
        sx={{
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          '@media (min-width: 850px)': { maxWidth: reserve ? CONTENT_PERCENT_SIZE : '100%' }
        }}>
        {children}
      </Stack>
      <Box sx={{
        width: 0,
        flexShrink: 0,
        overflow: 'hidden',
        '@media (min-width: 850px)': { width: reserve ? 300 : 0 }
      }}>
        <SidebarAd/>
      </Box>
    </Stack>
  );
}

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
