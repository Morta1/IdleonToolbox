import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import NavItemsList from './NavItemsList';
import LoginButton from './LoginButton';
import AppDrawer from './AppDrawer';
import { drawerWidth, navBarHeight } from '../../constants';
import { useRouter } from 'next/router';
import { prefix, shouldDisplayDrawer } from '@utility/helpers';
import { Link, Stack, Typography } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import Pin from '@components/common/favorites/Pin';
import dynamic from 'next/dynamic';
import { hasGoals } from '@utility/goals/routes';
import PageTitle from '@components/common/PageTitle';
import QuickSearch from '@components/common/QuickSearch';
import UserMenu from '@components/common/NavBar/UserMenu';

import useFormatDate from '@hooks/useFormatDate';
import AuthSkeleton from './AuthSkeleton';
import { BottomBannerAd, SidebarAd } from '@components/common/Ads/AdUnit';
import { useSidebarAdBlocked } from '@hooks/useSidebarAd';
import usePageDataLoading from '@hooks/usePageDataLoading';
import PageLoadingProvider, { usePageLoadingState } from '@components/common/context/PageLoadingProvider';
import ProfileBanner from './ProfileBanner';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';
import { DISCORD_BOT_INSTALL_URL, DISCORD_SERVER_URL, trackBotInstallClick } from '@components/discordLinks';
import NextLink from 'next/link';
import { sessionQuery } from '@utility/nav-query';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { NavMenuPanel } from './NavMenu';

// Parser-heavy popover: kept out of every page's bundle, fetched only on routes that have goals
const AddGoalButton = dynamic(() => import('@components/goals/AddGoalButton'), { ssr: false });

const NavBar = ({ children }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const displayDrawer = shouldDisplayDrawer(router?.pathname);
  const pathname = router?.pathname || '';
  const isHomePage = pathname === '/' || pathname === '';
  const isInnerPage = !isHomePage && pathname !== '/patch-notes';
  const [openPolicy, setOpenPolicy] = useState(false);
  const formatDate = useFormatDate();
  const prefetch = useNavPrefetch();
  // The bar's open menu: 'account', 'tools' or null. A page change closes it.
  const [openMenu, setOpenMenu] = useState(null);
  useEffect(() => {
    const close = () => setOpenMenu(null);
    router?.events?.on('routeChangeStart', close);
    return () => router?.events?.off('routeChangeStart', close);
  }, [router?.events]);
  const toggleMenu = (menu) => setOpenMenu((current) => (current === menu ? null : menu));

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
            <Typography variant={'body2'} sx={{ fontWeight: 'bold' }}>{state?.characters?.[0]?.name}</Typography>
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
    {/* Sticky, so it holds its own place in the flow and nothing has to stand under it. navBarHeight tall with the
        theme's bottom border included, so every sticky top that reads navBarHeight sits right under it. */}
    <MuiAppBar position="sticky" data-shell="bar"
               sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, height: navBarHeight, boxSizing: 'border-box' }}>
      <Toolbar sx={{ height: '100%', minHeight: 0 }}>
        <AppDrawer/>
        {/* The logo: one link home, the image decorative beside the name. The name takes the type scale's
            sectionTitle (18/26/600), the nearest step to the boards' 20/700; phones read "IT". */}
        <Link component={NextLink} href={{ pathname: '/', query: sessionQuery(router.query) }} prefetch={prefetch}
              underline="none" color="inherit" sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <img src={`${prefix}data/Coins5.png`} alt=""/>
          <Typography component="span" variant="sectionTitle" sx={{ display: { xs: 'none', sm: 'inline' } }}>Idleon Toolbox</Typography>
          <Typography component="span" variant="sectionTitle" sx={{ display: { xs: 'inline', sm: 'none' } }}>IT</Typography>
        </Link>
        <NavItemsList openMenu={openMenu} onMenu={toggleMenu}/>
        <QuickSearch/>
        {renderAuthSection()}
      </Toolbar>
    </MuiAppBar>
    <AppDrawer permanent/>
    <ProfileBanner/>
    {openMenu ? <NavMenuPanel key={openMenu} menu={openMenu} onClose={() => setOpenMenu(null)}/> : null}
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
        <Stack data-shell="header" direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'} sx={{ mb: 1 }}>
          <PageTitle/>
          {(router?.pathname?.includes('account') || router?.pathname?.includes('tools')) ? <Pin/> : null}
          {hasGoals(router?.pathname) ? <AddGoalButton/> : null}
        </Stack>
        <ContentWrapper showSidebar={isInnerPage}>
          {children}
        </ContentWrapper>
      </Box>
      <Stack data-shell="footer" direction="row" justifyContent="center" alignItems="center" gap={1}
             divider={<Typography color="text.secondary" variant="caption">&middot;</Typography>}
             sx={{
               mt: 4,
               py: 1.5,
               borderTop: '1px solid',
               borderColor: 'divider',
               backgroundColor: 'background.default'
             }}>
        <Link href={DISCORD_SERVER_URL} target="_blank" rel="noopener"
              variant="caption" color="text.secondary">
          Discord
        </Link>
        <Link href={DISCORD_BOT_INSTALL_URL} target="_blank" rel="noopener"
              onClick={() => trackBotInstallClick('footer')}
              variant="caption" color="text.secondary">
          Discord bot
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

  if (!showSidebar) return <Box data-shell="page">{children}</Box>;

  // While the page is waiting for data there is nothing to keep clear of the fixed rail ad, and a
  // reserved gutter would push the loader ~165px left of the viewport centre with an empty 300px
  // void beside it. SidebarAd stays mounted through the collapse so the ad is never recreated.
  //
  // The 850px breakpoint lives in CSS, not in a media query hook: a hook is false at build and on
  // the first client render, so the export would ship a full-width column that narrows one
  // render later. The column takes whatever the gutter leaves; no percentage cap. Adblock detection cannot be done in CSS and starts as "not blocked", so the
  // export reserves the gutter and only adblock users see a collapse rather than an expansion.
  const reserve = !adBlocked && !loading && !pageReportedLoading;

  return (
    <Stack direction={'row'} justifyContent={'space-between'}
           sx={{ width: '100%', minWidth: 0, gap: 0, '@media (min-width: 850px)': { gap: reserve ? 2 : 0 } }}>
      <Stack data-shell="page" sx={{ flex: 1, minWidth: 0 }}>
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

export default NavBar;
