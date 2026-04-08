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
import { handleLoadJson, isProd, shouldDisplayDrawer } from '@utility/helpers';
import { Link, Stack, Typography, useMediaQuery } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import AdBlockerPopup from '@components/common/AdBlockerPopup';
import Pin from '@components/common/favorites/Pin';
import QuickSearch from '@components/common/QuickSearch';
import UserMenu from '@components/common/NavBar/UserMenu';
import IconButton from '@mui/material/IconButton';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import useFormatDate from '@hooks/useFormatDate';
import { CONTENT_PERCENT_SIZE } from '@utility/consts';
import AuthSkeleton from './AuthSkeleton';
import { BottomBannerAd, SidebarAd } from '@components/common/Ads/AdUnit';
import useAdBlockDetection from '../../../hooks/useAdBlockDetection';
import ProfileBanner from './ProfileBanner';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';

const NavBar = ({ children }) => {
  const { dispatch, state } = useContext(AppContext);
  const router = useRouter();
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const displayDrawer = shouldDisplayDrawer(router?.pathname);
  const pathname = router?.pathname || '';
  const isHomePage = pathname === '/' || pathname === '';
  const isInnerPage = !isHomePage && pathname !== '/patch-notes';
  const [openPolicy, setOpenPolicy] = useState(false);
  const formatDate = useFormatDate();

  const handlePaste = async () => {
    await handleLoadJson(dispatch);
  }

  // Render the authentication section based on loading state
  const renderAuthSection = () => {
    if (state.isLoading) {
      return <AuthSkeleton/>;
    }

    return (
      <>
        {state?.signedIn || state?.profile ? <UserMenu/> : <LoginButton/>}
        {state?.signedIn ? (
          <Stack sx={{ p: 1, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: 14 }}>{state?.characters?.[0]?.name}</Typography>
            {state?.lastUpdated ? (
              <Typography variant={'caption'}>
                {state?.lastUpdated ? formatDate(state?.lastUpdated, { showSeconds: false, shortYear: true }) : 'xx/xx/xx xx:xx'}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </>
    );
  };

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
        {(router?.pathname?.includes('account') || router?.pathname?.includes('tools')) ? <Pin/> : null}
        <ContentWrapper showSidebar={isInnerPage} isLoading={state?.isLoading} isHomePage={isHomePage}>
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
    <BottomBannerAd displayDrawer={displayDrawer} />
  </>
};

const ContentWrapper = ({ showSidebar, children }) => {
  const showNarrowSideBanner = useMediaQuery('(min-width: 850px)', { noSsr: true });
  const adBlocked = useAdBlockDetection();

  if (!showSidebar) return children;

  const showSidebarAd = showNarrowSideBanner && !adBlocked;

  return (
    <Stack direction={'row'} gap={2} justifyContent={'space-between'} sx={{ width: '100%' }}>
      <Stack
        sx={{
          width: '100%',
          maxWidth: showSidebarAd ? CONTENT_PERCENT_SIZE : '100%'
        }}>
        {children}
      </Stack>
      <SidebarAd />
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
