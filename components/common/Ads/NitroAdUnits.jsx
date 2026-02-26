import { useEffect } from 'react';
import { isProd } from '@utility/helpers';

const NITRO_BASE_OPTIONS = {
  refreshLimit: 10,
  refreshTime: 30,
  refreshVisibleOnly: true,
  demo: !isProd
}

export const NitroRailAd = ({ id, alignment, sizes, style }) => {
  useEffect(() => {
    if (window.nitroAds) {
      window.nitroAds.createAd(id, {
        ...NITRO_BASE_OPTIONS,
        'format': 'rail',
        'rail': alignment,
        'anchorClose': 'false',
        'railCollisionWhitelist': ['*'],
        'mediaQuery': '(min-width: 850px)',
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
      style={{ minHeight: '600px', minWidth: 300, width: '100%', ...style }}
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
