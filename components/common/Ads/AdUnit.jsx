import { GoogleBottomBannerAd, GoogleHomeSideAds, GoogleSidebarAd } from '@components/common/Ads/GoogleAdUnit';
import Box from '@mui/material/Box';
import { NitroBottomBannerAd, NitroRailAd } from '@components/common/Ads/NitroAdUnits';
import { useMediaQuery } from '@mui/material';
import useAdBlockDetection from '../../../hooks/useAdBlockDetection';

export const AD_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  NITRO: 'NITRO'
}
export const AD_PROVIDER = AD_PROVIDERS.NITRO;

const NITRO_SIDE_AD_SIZES = [['300', '600'], ['300', '250'], ['160', '600']];
const NITRO_HOME_AD_SIZES = [['160', '600']];

export const SidebarAd = () => {
  const showAd = useMediaQuery('(min-width: 850px)', { noSsr: true });
  const adBlocked = useAdBlockDetection();

  if (!showAd || adBlocked) return null;

  return <Box sx={{ width: 300, flexShrink: 0 }}>
    {AD_PROVIDER === AD_PROVIDERS.GOOGLE ? <GoogleSidebarAd/> : null}
    {AD_PROVIDER === AD_PROVIDERS.NITRO ? <NitroRailAd id={'nitro-side-ad'} alignment={'right'} sizes={NITRO_SIDE_AD_SIZES}/> : null}
  </Box>;
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