import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import NavItemsList from './NavItemsList';
import LoginButton from './LoginButton';
import PhoneMenu from './PhoneMenu';
import { navBarHeight } from '../../constants';
import { useRouter } from 'next/router';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { Link, Stack, Typography } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import QuickSearch from '@components/common/QuickSearch';
import UserMenu from '@components/common/NavBar/UserMenu';
import { ThemeLink } from '@components/common/NavBar/ThemeRows';

import useFormatDate from '@hooks/useFormatDate';
import AuthSkeleton from './AuthSkeleton';
import { BottomBannerAd, SideAds } from '@components/common/Ads/AdUnit';
import ProfileBanner from './ProfileBanner';
import { openCookiePolicy } from '@components/common/Etc/CookiePolicyDialog';
import { DISCORD_BOT_INSTALL_URL, DISCORD_SERVER_URL, trackBotInstallClick } from '@components/discordLinks';
import NextLink from 'next/link';
import { sessionQuery } from '@utility/nav-query';
import { trackMenuLink } from '@utility/analytics';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { NavMenuPanel, useBarMenu } from './NavMenu';
import { BAR_TIGHT, capPageWidth, pageColumnSx, PHONE_SIDES } from './frame';
import { touchTarget } from '../../../styles/theme/theme';
import useFrame from './useFrame';
import GroupRow from './GroupRow';
import PageHeader, { PageHeaderSlots } from './PageHeader';

const NavBar = ({ children }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const formatDate = useFormatDate();
  const prefetch = useNavPrefetch();
  // The bar's open menu and the phone menu (null, or { group } it opened at). A page change closes both; a query-only
  // change (a page writing its own state to the URL, Wardrobe's companion) does not.
  const { openMenu, setOpenMenu, toggleMenu, restOn, endRest } = useBarMenu();
  const [phoneMenuAt, setPhoneMenuAt] = useState(null);
  useEffect(() => {
    const close = (url) => {
      if (new URL(url, window.location.href).pathname === window.location.pathname) return;
      trackMenuLink();
      setOpenMenu(null);
      setPhoneMenuAt(null);
    };
    router?.events?.on('routeChangeStart', close);
    return () => router?.events?.off('routeChangeStart', close);
  }, [router?.events]);
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
          <Stack sx={{ px: 1, minWidth: 0 }}>
            <Typography variant={'body2'} noWrap sx={{ fontWeight: 'bold' }}>{cleanUnderscore(state?.characters?.[0]?.name)}</Typography>
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

  return <>
    {/* Sticky, so it holds its own place in the flow and nothing has to stand under it. navBarHeight tall with the
        theme's bottom border included, so every sticky top that reads navBarHeight sits right under it. */}
    <MuiAppBar position="sticky" data-shell="bar"
               sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, height: navBarHeight, boxSizing: 'border-box' }}>
      {/* Dense: the regular variant's 64 px floor sits in a media query that minHeight here does not reach, and from 600 px
          it held the row lower than the bar */}
      <Toolbar variant="dense" sx={{ height: '100%', minHeight: 0, [BAR_TIGHT]: { px: 2 } }}>
        <PhoneMenu at={phoneMenuAt} onOpen={(group) => setPhoneMenuAt({ group })} onClose={() => setPhoneMenuAt(null)}/>
        {/* The logo: one link home, the image decorative beside the name. The name takes the type scale's
            sectionTitle (18/26/600), the nearest step to the boards' 20/700; phones read "IT". */}
        <Link component={NextLink} href={{ pathname: '/', query: sessionQuery(router.query) }} prefetch={prefetch}
              underline="none" color="inherit"
              sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0, [BAR_TIGHT]: { mr: 1 }, ...touchTarget }}>
          <img src={`${prefix}data/Coins5.png`} alt="" width={28} height={28}/>
          <Typography component="span" variant="sectionTitle" sx={{ display: { xs: 'none', sm: 'inline' } }}>Idleon Toolbox</Typography>
          <Typography component="span" variant="sectionTitle" sx={{ display: { xs: 'inline', sm: 'none' } }}>IT</Typography>
        </Link>
        <NavItemsList openMenu={openMenu} onMenu={toggleMenu} onMenuRest={restOn} onMenuRestEnd={endRest}/>
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
      {/* Two groups of whole links: one line where all five fit, else a group per line, so no dot ever ends a line */}
      <Stack data-shell="footer" direction="row" justifyContent="center" alignItems="center" flexWrap="wrap" useFlexGap
             columnGap={1} rowGap={0.5}
             sx={{
               // main has no side padding now that the frame owns it: the footer keeps the page's sides
               mx: 3,
               [PHONE_SIDES]: { mx: 2 },
               px: 2,
               mt: 4,
               py: 1.5,
               borderTop: '1px solid',
               borderColor: 'divider',
               backgroundColor: 'background.default'
             }}>
        <Stack direction="row" sx={FOOTER_PAIR_SX}>
          <Link href={DISCORD_SERVER_URL} target="_blank" rel="noopener"
                variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Discord
          </Link>
          <FooterDot/>
          <Link href={DISCORD_BOT_INSTALL_URL} target="_blank" rel="noopener"
                onClick={() => trackBotInstallClick('footer')}
                variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Discord bot
          </Link>
        </Stack>
        <FooterDot sx={{ [FOOTER_TWO_LINES]: { display: 'none' } }}/>
        <Stack direction="row" sx={FOOTER_PAIR_SX}>
          <Link href="https://ko-fi.com/S6S7BHLQ4" target="_blank" rel="noopener"
                variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Buy me a coffee
          </Link>
          <FooterDot/>
          <Link component="button" variant="caption" color="text.secondary"
                sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                onClick={openCookiePolicy}>
            Cookie Policy
          </Link>
          <FooterDot/>
          <ThemeLink/>
        </Stack>
      </Stack>
    </Box>
    <BottomBannerAd/>
  </>
};

// SimpleLoader, a page's whole body while it loads
const PAGE_LOADER = '[data-testid="page-loader"]';

// The footer's links in two groups: below 480 px (all five need about 390 px of the footer's 400) each group takes its own
// line and the dot between the groups goes.
const FOOTER_TWO_LINES = '@media (max-width: 479.95px)';
const FOOTER_PAIR_SX = { alignItems: 'center', columnGap: 1, [FOOTER_TWO_LINES]: { flexBasis: '100%', justifyContent: 'center' } };
const FooterDot = ({ sx }) => <Typography color="text.secondary" variant="caption" aria-hidden sx={sx}>&middot;</Typography>;

// The page frame (frame.js): on inner pages the header row and the page sit in the page's column, with the side ads'
// gutters beside it; patch notes and the error pages keep the full width and have no side ad (useFrame.js).
const Frame = ({ header, children }) => {
  const { inner, sx, cap } = useFrame();

  if (!inner) return <Box data-shell="frame" sx={sx}>{header}<Box data-shell="page">{children}</Box></Box>;

  // SideAds mounts once per visit to inner pages: a page change keeps its units, so it never requests an ad.
  return <Box data-shell="frame" sx={sx}>
    <Box sx={pageColumnSx}>
      {/* A page with its own width cap takes its header with it; a loader in its place still spans the column */}
      <Box sx={cap ? capPageWidth(cap) : undefined}>{header}</Box>
      <Stack data-shell="page" sx={[{ minWidth: 0 }, cap ? { [`& > :not(${PAGE_LOADER})`]: capPageWidth(cap) } : {}]}>
        {children}
      </Stack>
    </Box>
    <SideAds/>
  </Box>;
};

export default NavBar;
