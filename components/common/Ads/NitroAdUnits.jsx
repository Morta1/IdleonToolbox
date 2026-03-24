import { useEffect } from 'react';
import { useTheme } from '@mui/material';

// Set to false to revert z-index overrides (e.g. if NitroPay ToS requires it)
const OVERRIDE_NITRO_ZINDEX = true;

const NITRO_BASE_OPTIONS = {
  refreshTime: 30,
  refreshVisibleOnly: true
}

export const NitroRailAd = ({ id, alignment, sizes, mediaQuery = '(min-width: 850px)', style }) => {
  const theme = useTheme();
  useEffect(() => {
    const styleEl = OVERRIDE_NITRO_ZINDEX ? document.createElement('style') : null;
    if (styleEl) {
      styleEl.textContent = `body > div:has(#${id}) { z-index: ${theme.zIndex.appBar - 1} !important; }`;
      document.head.appendChild(styleEl);
    }

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
      styleEl?.remove();
      // Rail ads are wrapped in a body > div created by NitroAds — remove the wrapper to fully clean up
      const wrapper = document.querySelector(`body > div:has(#${id})`);
      if (wrapper) {
        wrapper.remove();
      }
      else {
        const el = document.getElementById(id);
        if (el) el.remove();
      }
    };
  }, [id, alignment, sizes, theme]);

  return (
    <div
      id={id}
      style={{ ...style }}
    />
  );
};
export const NitroBottomBannerAd = () => {
  const theme = useTheme();
  useEffect(() => {
    const styleEl = OVERRIDE_NITRO_ZINDEX ? document.createElement('style') : null;
    if (styleEl) {
      styleEl.textContent = `#nitro-bottom-banner-ad { z-index: ${theme.zIndex.appBar - 1} !important; }`;
      document.head.appendChild(styleEl);
    }

    if (window.nitroAds) {
      window.nitroAds.createAd('nitro-bottom-banner-ad', {
        ...NITRO_BASE_OPTIONS,
        format: 'anchor-v2',
        anchor: 'bottom',
        anchorClose: false,
        anchorBgColor: 'transparent',
        mediaQuery: '(min-width: 729px)',
        sizes: [['970', '90'], ['728', '90'], ['320', '100'], ['320', '50']],
        report: {
          enabled: true,
          icon: true,
          wording: 'Report Ad',
          position: 'top-right'
        }
      });
      // window.nitroAds.createAd('nitro-bottom-banner-desktop', {
      //   ...NITRO_BASE_OPTIONS,
      //   format: 'anchor-v2',
      //   anchor: 'bottom',
      //   anchorClose: false,
      //   anchorBgColor: 'transparent',
      //   mediaQuery: '(min-width: 729px)',
      //   sizes: [['970', '90'], ['728', '90']],
      //   report: {
      //     enabled: true,
      //     icon: true,
      //     wording: 'Report Ad',
      //     position: 'top-right'
      //   }
      // });
      // window.nitroAds.createAd('nitro-bottom-banner-mobile', {
      //   ...NITRO_BASE_OPTIONS,
      //   format: 'anchor-v2',
      //   anchor: 'bottom',
      //   anchorClose: false,
      //   anchorBgColor: 'transparent',
      //   mediaQuery: '(max-width: 728px)',
      //   sizes: [['320', '100'], ['320', '50']],
      //   report: {
      //     enabled: true,
      //     icon: true,
      //     wording: 'Report Ad',
      //     position: 'top-right'
      //   }
      // });
    }

    return () => styleEl?.remove();
  }, [theme]);

  return null;
};
