import { useEffect } from 'react';

const NITRO_BASE_OPTIONS = {
  refreshLimit: 10,
  refreshTime: 30,
  refreshVisibleOnly: true
}

export const NitroRailAd = ({ id, alignment, sizes, mediaQuery = '(min-width: 850px)', style }) => {
  useEffect(() => {
    if (window.nitroAds) {
      window.nitroAds.createAd(id, {
        ...NITRO_BASE_OPTIONS,
        'format': 'rail',
        'rail': alignment,
        'anchorClose': 'false',
        'railCollisionWhitelist': ['*'],
        'mediaQuery': mediaQuery,
        'sizes': sizes,
        report: {
          enabled: true,
          icon: true,
          wording: 'Report Ad',
          position: 'top-right'
        }
      });
    }

    return () => {
      const el = document.getElementById(id);
      if (el) {
        el.remove()
      }
    }
  }, [id, alignment, sizes]);

  return (
    <div
      id={id}
      style={{ minHeight: '600px', ...style }}
    />
  );
};
export const NitroBottomBannerAd = () => {
  useEffect(() => {
    if (window.nitroAds) {
      window.nitroAds.createAd('nitro-bottom-banner-ad', {
        ...NITRO_BASE_OPTIONS,
        format: 'anchor-v2',
        anchor: 'bottom',
        anchorClose: false,
        anchorBgColor: 'transparent',
        sizes: [['728', '90'], ['320', '50'], ['320', '100'], ['970', '90']],
        report: {
          enabled: true,
          icon: true,
          wording: 'Report Ad',
          position: 'top-right'
        }
      });
    }
  }, []);

  return null;
};
