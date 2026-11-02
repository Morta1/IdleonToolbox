import { Box, useMediaQuery } from '@mui/material';
import { GoogleBottomBannerAd, GoogleHomeSideAds, GoogleSidebarAd } from '@components/common/Ads/GoogleAdUnit';
import { NitroBottomBannerAd, NitroRailAd, NitroSideAd } from '@components/common/Ads/NitroAdUnits';
import { useSidebarAdBlocked } from '@hooks/useSidebarAd';
import { adBoxSx, adGutterSx, CENTERED, ONE_AD } from '@components/common/NavBar/frame';

export const AD_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  NITRO: 'NITRO'
}
export const AD_PROVIDER = AD_PROVIDERS.NITRO;

const NITRO_SIDE_AD_SIZES = [['300', '600'], ['300', '250'], ['160', '600']];
const NITRO_HOME_AD_SIZES = [['160', '600']];

const NITRO_PAIR_SIZES = [['300', '600'], ['160', '600']];

// Development only: Nitro serves nothing on localhost, so each ad space shows a dashed stand-in at its size, the way the
// design boards draw an ad. NODE_ENV is fixed at build time, so the export (a production build) never carries it.
const DEV_PLACEHOLDERS = process.env.NODE_ENV !== 'production';
const placeholderSx = (theme) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
  boxSizing: 'border-box', border: '1px dashed', borderColor: 'text.disabled', color: 'text.secondary',
  pointerEvents: 'none', typography: 'body2',
  background: `repeating-linear-gradient(135deg, ${theme.vars.palette.background.paper} 0 12px, ${theme.vars.palette.background.default} 12px 24px)`
});
const SidePlaceholder = () => <Box aria-hidden sx={[placeholderSx, { position: 'absolute', inset: 0 }]}>
  <b>Ad</b>300 × 600
</Box>;
const AnchorPlaceholder = () => <Box aria-hidden sx={[placeholderSx, (theme) => ({
  position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: theme.zIndex.appBar - 1,
  width: { xs: 320, md: 728, lg: 970 }, height: { xs: 50, md: 90 }
})]}>
  <b>Ad</b>anchor
</Box>;

// The side ads beside an inner page (Layout boards; phase 4 Task 8). The frame lays out their gutters by CSS (frame.js);
// a unit exists only while its layout's query matches, since nothing serves an ad into a hidden box, so crossing a
// breakpoint destroys one layout's units and creates the other's. nitro-side-ad keeps today's id and sizes beside one
// ad, so its line in Nitro's reports stays comparable; the two-ad layout has its own pair. Mounted once per visit to
// inner pages (NavBar's Frame), so a page change never requests an ad. A blocker removes the gutters, React's own boxes.
export const SideAds = () => {
  const blocked = useSidebarAdBlocked();
  // False at build and on the first client render, so the export carries the empty gutters and no unit
  const one = useMediaQuery(ONE_AD);
  const two = useMediaQuery(CENTERED);
  if (blocked) return null;
  const nitro = AD_PROVIDER === AD_PROVIDERS.NITRO;
  return <>
    <Box sx={adGutterSx('left')}>
      <Box data-shell="side-ad" data-side="left" sx={adBoxSx}>
        {DEV_PLACEHOLDERS ? <SidePlaceholder/> : null}
        {nitro && two ? <NitroSideAd id="nitro-side-left" sizes={NITRO_PAIR_SIZES} side="left"/> : null}
      </Box>
    </Box>
    <Box sx={adGutterSx('right')}>
      <Box data-shell="side-ad" data-side="right" sx={adBoxSx}>
        {DEV_PLACEHOLDERS ? <SidePlaceholder/> : null}
        {nitro && one ? <NitroSideAd id="nitro-side-ad" sizes={NITRO_SIDE_AD_SIZES} side="right"/> : null}
        {nitro && two ? <NitroSideAd id="nitro-side-right" sizes={NITRO_PAIR_SIZES} side="right"/> : null}
        {AD_PROVIDER === AD_PROVIDERS.GOOGLE ? <GoogleSidebarAd/> : null}
      </Box>
    </Box>
  </>;
};

export const BottomBannerAd = ({ displayDrawer }) => {
  if (AD_PROVIDER === AD_PROVIDERS.GOOGLE) {
    return <GoogleBottomBannerAd displayDrawer={displayDrawer}/>
  }
  if (AD_PROVIDER === AD_PROVIDERS.NITRO) {
    return <>
      <NitroBottomBannerAd/>
      {DEV_PLACEHOLDERS ? <AnchorPlaceholder/> : null}
    </>
  }

  return null;
}

export const HomeSidebarAds = () => {
  if (AD_PROVIDER === AD_PROVIDERS.GOOGLE) {
    return <GoogleHomeSideAds/>
  }
  if (AD_PROVIDER === AD_PROVIDERS.NITRO) {
    // NitroAds relocates rails into a body > div, so both must sit behind a React-owned wrapper. A bare fragment leaves the relocated divs as the nodes React
    // itself removes on unmount, which throws NotFoundError and takes the whole tree down.
    // teardownOnNavigate: these two are the only route-scoped rails, so they are the only ones that
    // have to be destroyed on the way out of the page rather than on unmount. SideAds above stays
    // mounted across navigation and has no teardown.
    return <div>
      <NitroRailAd id={'nitro-home-right-side-ad'} alignment={'right'} sizes={NITRO_HOME_AD_SIZES}
                   mediaQuery={'(min-width: 1650px)'} teardownOnNavigate/>
      <NitroRailAd id={'nitro-home-left-side-ad'} alignment={'left'} sizes={NITRO_HOME_AD_SIZES}
                   mediaQuery={'(min-width: 1650px)'} teardownOnNavigate/>
    </div>;
  }
  return null;
}
