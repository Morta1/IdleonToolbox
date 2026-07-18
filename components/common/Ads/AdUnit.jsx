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
    return <>
      <NitroRailAd id={'nitro-home-right-side-ad'} alignment={'right'} sizes={NITRO_HOME_AD_SIZES}
                   mediaQuery={'(min-width: 1650px)'}/>
      <NitroRailAd id={'nitro-home-left-side-ad'} alignment={'left'} sizes={NITRO_HOME_AD_SIZES}
                   mediaQuery={'(min-width: 1650px)'}/>
    </>;
  }
  return null;
}