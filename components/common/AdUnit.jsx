import React from 'react';
import Box from '@mui/material/Box';
import { useMediaQuery } from '@mui/material';
import { Adsense } from '@ctrl/react-adsense';
import { isProd } from '@utility/helpers';
import { useRouter } from 'next/router';

const AD_CLIENT = 'ca-pub-1842647313167572';

/**
 * Ad placement configurations.
 * Each placement defines its slots, sizes, and responsive behavior.
 */
const PLACEMENTS = {
  // Sticky sidebar ad (right side of content)
  sidebar: {
    wide: { slot: '9767369641', width: 300, height: 600, minScreen: 1600 },
    narrow: { slot: '7851151731', width: 300, height: 250, minScreen: 850 }
  },
  // Fixed bottom banner
  bottomBanner: {
    slot: '1488341218',
    mobile: { width: 320, height: 50 },
    desktop: { width: 728, height: 90 }
  },
  // Home page side banners (left + right)
  homeSideLeft: { slot: '8673408690', width: 160, height: 600 },
  homeSideRight: { slot: '6626749728', width: 160, height: 600 }
};

/**
 * Sidebar ad unit - sticky on the right side of content.
 */
export const SidebarAd = () => {
  const showWide = useMediaQuery('(min-width: 1600px)', { noSsr: true });
  const showNarrow = useMediaQuery('(min-width: 850px)', { noSsr: true });
  const router = useRouter();

  if (!showWide && !showNarrow) return null;

  const { wide, narrow } = PLACEMENTS.sidebar;
  const config = showWide ? wide : narrow;

  return (
    <Box
      key={router.asPath}
      sx={{
        backgroundColor: isProd ? 'transparent' : '#d73333',
        width: config.width,
        height: config.height,
        position: 'sticky',
        top: { xs: '75px', sm: '110px' },
        alignSelf: 'flex-start',
        flexShrink: 0
      }}
    >
      {isProd ? <Adsense client={AD_CLIENT} slot={config.slot} /> : null}
    </Box>
  );
};

/**
 * Bottom fixed banner ad.
 * Mobile: 320x50 (Mobile Leaderboard)
 * Desktop: 728x90 (Leaderboard)
 */
export const BottomBannerAd = ({ displayDrawer }) => {
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const router = useRouter();

  const size = isXs ? PLACEMENTS.bottomBanner.mobile : PLACEMENTS.bottomBanner.desktop;

  return (
    <Box
      key={router?.asPath}
      style={{
        backgroundColor: isProd ? '' : '#d73333',
        position: 'fixed',
        bottom: 0,
        left: { xs: 'inherit', lg: displayDrawer ? 240 : 3 },
        height: size.height,
        maxHeight: size.height,
        width: '100%'
      }}
    >
      <Adsense
        style={{
          display: 'block',
          width: size.width,
          height: size.height,
          maxHeight: size.height,
          margin: '0 auto'
        }}
        client={AD_CLIENT}
        slot={PLACEMENTS.bottomBanner.slot}
        format=""
      />
    </Box>
  );
};

/**
 * Home page side banner ads (left and right).
 * Only visible on screens >= 1650px.
 * Size: 160x600 (Wide Skyscraper).
 */
export const HomeSideAds = () => {
  const showSideAds = useMediaQuery('(min-width: 1650px)', { noSsr: true });

  if (!showSideAds) return null;

  const sideStyle = (position) => ({
    height: 600,
    backgroundColor: isProd ? '' : '#d73333',
    width: 160,
    position: 'absolute',
    top: 100,
    [position]: 50
  });

  return (
    <>
      <div style={sideStyle('left')}>
        {isProd && <Adsense client={AD_CLIENT} slot={PLACEMENTS.homeSideLeft.slot} />}
      </div>
      <div style={sideStyle('right')}>
        {isProd && <Adsense client={AD_CLIENT} slot={PLACEMENTS.homeSideRight.slot} />}
      </div>
    </>
  );
};

export default {
  SidebarAd,
  BottomBannerAd,
  HomeSideAds
};
