import { GoogleBottomBannerAd, GoogleHomeSideAds, GoogleSidebarAd } from '@components/common/Ads/GoogleAdUnit';
import { NitroBottomBannerAd, NitroRailAd } from '@components/common/Ads/NitroAdUnits';
import useSidebarAd from '@hooks/useSidebarAd';

export const AD_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  NITRO: 'NITRO'
}
export const AD_PROVIDER = AD_PROVIDERS.NITRO;

const NITRO_SIDE_AD_SIZES = [['300', '600'], ['300', '250'], ['160', '600']];
const NITRO_HOME_AD_SIZES = [['160', '600']];

// The 300px gutter this sits in is owned by ContentWrapper, not by this component. That gutter
// collapses while a page is loading, and unmounting SidebarAd to collapse it would run
// NitroRailAd's cleanup and destroy the ad on every page load.
export const SidebarAd = () => {
  const showAd = useSidebarAd();

  if (!showAd) return null;

  // NitroAds relocates #nitro-side-ad into a body > div, so React must never be the one to remove
  // it - that throws NotFoundError and takes down the tree. This wrapper stays put and is what
  // React removes when the ad is hidden.
  return <div>
    {AD_PROVIDER === AD_PROVIDERS.GOOGLE ? <GoogleSidebarAd/> : null}
    {AD_PROVIDER === AD_PROVIDERS.NITRO ? <NitroRailAd id={'nitro-side-ad'} alignment={'right'} sizes={NITRO_SIDE_AD_SIZES}/> : null}
  </div>;
}

export const BottomBannerAd = ({ displayDrawer }) => {
  if (AD_PROVIDER === AD_PROVIDERS.GOOGLE) {
    return <GoogleBottomBannerAd displayDrawer={displayDrawer}/>
  }
  if (AD_PROVIDER === AD_PROVIDERS.NITRO) {
    return <NitroBottomBannerAd/>
  }

  return null;
}

export const HomeSidebarAds = () => {
  if (AD_PROVIDER === AD_PROVIDERS.GOOGLE) {
    return <GoogleHomeSideAds/>
  }
  if (AD_PROVIDER === AD_PROVIDERS.NITRO) {
    // Same reason as SidebarAd above: NitroAds relocates both rails into a body > div, so they must
    // sit behind a React-owned wrapper. A bare fragment leaves the relocated divs as the nodes React
    // itself removes on unmount, which throws NotFoundError and takes the whole tree down.
    // teardownOnNavigate: these two are the only route-scoped rails, so they are the only ones that
    // have to be destroyed on the way out of the page rather than on unmount. SidebarAd above stays
    // mounted across navigation and must not opt in.
    return <div>
      <NitroRailAd id={'nitro-home-right-side-ad'} alignment={'right'} sizes={NITRO_HOME_AD_SIZES}
                   mediaQuery={'(min-width: 1650px)'} teardownOnNavigate/>
      <NitroRailAd id={'nitro-home-left-side-ad'} alignment={'left'} sizes={NITRO_HOME_AD_SIZES}
                   mediaQuery={'(min-width: 1650px)'} teardownOnNavigate/>
    </div>;
  }
  return null;
}
