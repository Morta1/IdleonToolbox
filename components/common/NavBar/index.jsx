import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import NavItemsList from './NavItemsList';
import LoginButton from './LoginButton';
import PhoneMenu from './PhoneMenu';
import { navBarHeight } from '../../constants';
import { useRouter } from 'next/router';
import { prefix } from '@utility/helpers';
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
import { frameSx } from './frame';
import GroupRow from './GroupRow';

// Parser-heavy popover: kept out of every page's bundle, fetched only on routes that have goals
const AddGoalButton = dynamic(() => import('@components/goals/AddGoalButton'), { ssr: false });

const NavBar = ({ children }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const pathname = router?.pathname || '';
  const isHomePage = pathname === '/' || pathname === '';
  const isInnerPage = !isHomePage && pathname !== '/patch-notes';
  const [openPolicy, setOpenPolicy] = useState(false);
  const formatDate = useFormatDate();
  const prefetch = useNavPrefetch();
  // The bar's open menu ('account', 'tools' or null) and the phone menu (null, or { group } it opened at). A page
  // change closes both.
  const [openMenu, setOpenMenu] = useState(null);
  const [phoneMenuAt, setPhoneMenuAt] = useState(null);
  useEffect(() => {
    const close = () => {
      setOpenMenu(null);
      setPhoneMenuAt(null);
    };
    router?.events?.on('routeChangeStart', close);
    return () => router?.events?.off('routeChangeStart', close);
  }, [router?.events]);
  const toggleMenu = (menu) => setOpenMenu((current) => (current === menu ? null : menu));
  // A group row's name: the bar's panel from lg, where the bar has its menus; the phone menu at that group below it.
  const openGroupMenu = (group) => {
    if (window.matchMedia('(min-width: 1200px)').matches) toggleMenu(group.menu);
    else setPhoneMenuAt({ group: group.key });
  };

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
        <PhoneMenu at={phoneMenuAt} onOpen={(group) => setPhoneMenuAt({ group })} onClose={() => setPhoneMenuAt(null)}/>
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
    <ProfileBanner/>
    {openMenu ? <NavMenuPanel key={openMenu} menu={openMenu} onClose={() => setOpenMenu(null)}/> : null}
    <Box component={'main'} sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: `calc(100vh - ${navBarHeight}px)`,
      pt: 3,
      pb: 'var(--nitro-ad-height, 0px)'
    }}>
      <Box sx={{ flex: 1 }}>
        <Frame inner={isInnerPage} header={<>
          <GroupRow openMenu={openMenu} phoneMenuOpen={Boolean(phoneMenuAt)} onOpenMenu={openGroupMenu}/>
          <Stack data-shell="header" direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'} sx={{ mb: 1 }}>
            <PageTitle/>
            {(router?.pathname?.includes('account') || router?.pathname?.includes('tools')) ? <Pin/> : null}
            {hasGoals(router?.pathname) ? <AddGoalButton/> : null}
          </Stack>
        </>}>
          {children}
        </Frame>
      </Box>
      <Stack data-shell="footer" direction="row" justifyContent="center" alignItems="center" gap={1}
             divider={<Typography color="text.secondary" variant="caption">&middot;</Typography>}
             sx={{
               // main has no side padding now that the frame owns it: the footer keeps its 24 px sides
               mx: 3,
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
    <BottomBannerAd/>
  </PageLoadingProvider>
};

// The page frame (frame.js) around the header row and the page. Inner pages keep the side rail's gutter, or sit
// centered between the rails; home and patch notes keep the full width and have no rail.
const Frame = ({ inner, header, children }) => {
  const adBlocked = useSidebarAdBlocked();
  const { loading } = usePageDataLoading();
  const pageReportedLoading = usePageLoadingState();

  if (!inner) return <Box data-shell="frame" sx={{ px: 3 }}>{header}<Box data-shell="page">{children}</Box></Box>;

  // While the page is waiting for data there is nothing to keep clear of the fixed rail ad, and a
  // reserved gutter would push the loader ~165px left of the viewport centre with an empty 300px
  // void beside it. SidebarAd stays mounted through the collapse so the ad is never recreated.
  //
  // The 850px breakpoint lives in CSS, not in a media query hook: a hook is false at build and on
  // the first client render, so the export would ship a full-width column that narrows one
  // render later. Adblock detection cannot be done in CSS and starts as "not blocked", so the
  // export reserves the gutter and only adblock users see a collapse rather than an expansion.
  const reserveRail = !adBlocked && !loading && !pageReportedLoading;

  return <>
    <Box data-shell="frame" sx={frameSx({ reserveRail })}>
      {header}
      <Stack data-shell="page" sx={{ minWidth: 0 }}>
        {children}
      </Stack>
    </Box>
    {/* NitroAds moves the rail into a body > div; until it does (or when it never does), its node sits here unseen */}
    <Box sx={{ width: 0, height: 0, overflow: 'hidden' }}>
      <SidebarAd/>
    </Box>
  </>;
};

export default NavBar;
