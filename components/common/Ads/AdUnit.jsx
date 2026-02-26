import { GoogleBottomBannerAd, GoogleHomeSideAds, GoogleSidebarAd } from '@components/common/Ads/GoogleAdUnit';
import Box from '@mui/material/Box';
import { NitroBottomBannerAd, NitroRailAd } from '@components/common/Ads/NitroAdUnits';
import { useMediaQuery } from '@mui/material';

export const AD_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  NITRO: 'NITRO'
}
export const AD_PROVIDER = AD_PROVIDERS.NITRO;

export const SidebarAd = () => {
  const showAd = useMediaQuery('(min-width: 850px)', { noSsr: true });
  if (!showAd) return null;

  return <Box sx={{ width: 300, flexShrink: 0 }}>
    {AD_PROVIDER === AD_PROVIDERS.GOOGLE ? <GoogleSidebarAd/> : null}
    {AD_PROVIDER === AD_PROVIDERS.NITRO ? <NitroRailAd id={'nitro-side-ad'} alignment={'right'} sizes={[
      ['300', '600'],
      ['160', '600']
    ]}/> : null}
  </Box>;
}

export const BottomBannerAd = () => {
  if (AD_PROVIDER === AD_PROVIDERS.GOOGLE) {
    return <GoogleBottomBannerAd/>
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
      <NitroRailAd id={'nitro-home-right-side-ad'} alignment={'right'} sizes={[['160', '600']]}
                   style={{ position: 'absolute' }}/>
      <NitroRailAd id={'nitro-home-left-side-ad'} alignment={'left'} sizes={[['160', '600']]}
                   style={{ position: 'absolute' }}/>
    </>;
  }
  return null;
}