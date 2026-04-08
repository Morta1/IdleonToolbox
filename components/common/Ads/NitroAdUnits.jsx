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
        sizes: [['970', '90'], ['728', '90'], ['320', '100'], ['320', '50']],
        report: {
          enabled: true,
          icon: true,
          wording: 'Report Ad',
          position: 'top-right'
        }
      });
    }

    const handleAnchorVisibility = (event) => {
      const { id, location } = event.detail;
      if (location !== 'bottom') return;

      // Event fires slightly before the element is visible/hidden, wait for correct height
      setTimeout(() => {
        const el = document.getElementById(id);
        const rect = el?.getBoundingClientRect();
        if (rect) {
          document.documentElement.style.setProperty('--nitro-ad-height', `${rect.height}px`);
        } else {
          document.documentElement.style.setProperty('--nitro-ad-height', '0px');
        }
      }, 100);
    };

    document.addEventListener('nitroAds.anchorVisibility', handleAnchorVisibility);

    return () => {
      styleEl?.remove();
      document.removeEventListener('nitroAds.anchorVisibility', handleAnchorVisibility);
      document.documentElement.style.setProperty('--nitro-ad-height', '0px');
    };
  }, [theme]);

  return null;
};
