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
import QuickSearch from '@components/common/QuickSearch';
import UserMenu from '@components/common/NavBar/UserMenu';

import useFormatDate from '@hooks/useFormatDate';
import AuthSkeleton from './AuthSkeleton';
import { BottomBannerAd, SidebarAd } from '@components/common/Ads/AdUnit';
import PageLoadingProvider from '@components/common/context/PageLoadingProvider';
import ProfileBanner from './ProfileBanner';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';
import { DISCORD_BOT_INSTALL_URL, DISCORD_SERVER_URL, trackBotInstallClick } from '@components/discordLinks';
import NextLink from 'next/link';
import { sessionQuery } from '@utility/nav-query';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { NavMenuPanel } from './NavMenu';
import { BAR_TIGHT } from './frame';
import useFrame from './useFrame';
import GroupRow from './GroupRow';
import PageHeader, { PageHeaderSlots } from './PageHeader';

const NavBar = ({ children }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
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
        {/* The one part of the bar that gives when a long name meets a narrow bar: an ellipsis, never a second row */}
        {state?.signedIn ? (
          <Stack sx={{ p: 1, minWidth: 0 }}>
            <Typography variant={'body2'} noWrap sx={{ fontWeight: 'bold' }}>{state?.characters?.[0]?.name}</Typography>
            {state?.lastUpdated ? (
              <Typography variant={'caption'} noWrap>
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
      <Toolbar sx={{ height: '100%', minHeight: 0, [BAR_TIGHT]: { px: 2 } }}>
        <PhoneMenu at={phoneMenuAt} onOpen={(group) => setPhoneMenuAt({ group })} onClose={() => setPhoneMenuAt(null)}/>
        {/* The logo: one link home, the image decorative beside the name. The name takes the type scale's
            sectionTitle (18/26/600), the nearest step to the boards' 20/700; phones read "IT". */}
        <Link component={NextLink} href={{ pathname: '/', query: sessionQuery(router.query) }} prefetch={prefetch}
              underline="none" color="inherit"
              sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, [BAR_TIGHT]: { mr: 1 } }}>
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
        <PageHeaderSlots>
          <Frame header={<>
            <GroupRow openMenu={openMenu} phoneMenuOpen={Boolean(phoneMenuAt)} onOpenMenu={openGroupMenu}/>
            <PageHeader onOpenGroup={(group) => setPhoneMenuAt({ group })}/>
          </>}>
            {children}
          </Frame>
        </PageHeaderSlots>
      </Box>
      {/* Whole links wrap: a phone puts two on a line instead of breaking each one's words */}
      <Stack data-shell="footer" direction="row" justifyContent="center" alignItems="center" flexWrap="wrap" useFlexGap
             columnGap={1} rowGap={0.5}
             divider={<Typography color="text.secondary" variant="caption">&middot;</Typography>}
             sx={{
               // main has no side padding now that the frame owns it: the footer keeps its 24 px sides
               mx: 3,
               px: 2,
               mt: 4,
               py: 1.5,
               borderTop: '1px solid',
               borderColor: 'divider',
               backgroundColor: 'background.default'
             }}>
        <Link href={DISCORD_SERVER_URL} target="_blank" rel="noopener"
              variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Discord
        </Link>
        <Link href={DISCORD_BOT_INSTALL_URL} target="_blank" rel="noopener"
              onClick={() => trackBotInstallClick('footer')}
              variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Discord bot
        </Link>
        <Link href="https://ko-fi.com/S6S7BHLQ4" target="_blank" rel="noopener"
              variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Buy me a coffee
        </Link>
        <Link component="button" variant="caption" color="text.secondary"
              sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
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
const Frame = ({ header, children }) => {
  const { inner, sx } = useFrame();

  if (!inner) return <Box data-shell="frame" sx={sx}>{header}<Box data-shell="page">{children}</Box></Box>;

  // SidebarAd stays mounted through the gutter's collapse (a loader, a blocker), so the ad is never recreated.
  return <>
    <Box data-shell="frame" sx={sx}>
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
