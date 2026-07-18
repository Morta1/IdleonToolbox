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

    const setHeight = (height) => {
      document.documentElement.style.setProperty('--nitro-ad-height', `${height}px`);
    };

    const handleAnchorVisibility = (event) => {
      const { id, location } = event.detail;
      if (location !== 'bottom') return;

      // Event fires slightly before the element is visible/hidden, wait for correct height
      setTimeout(() => {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        setHeight(rect ? rect.height : 0);
      }, 100);
    };

    document.addEventListener('nitroAds.anchorVisibility', handleAnchorVisibility);

    // The ads script loads afterInteractive, so anchorVisibility can fire before the listener above
    // is attached - and it never fires again, leaving --nitro-ad-height stuck at 0px and the banner
    // overlapping the footer. Measure the element directly as well, once it appears.
    let resizeObserver;
    const observeBanner = () => {
      const el = document.getElementById('nitro-bottom-banner-ad');
      if (!el) return false;

      resizeObserver = new ResizeObserver(([entry]) => setHeight(entry.target.getBoundingClientRect().height));
      resizeObserver.observe(el);
      return true;
    };

    let mutationObserver;
    if (!observeBanner()) {
      mutationObserver = new MutationObserver(() => {
        if (observeBanner()) {
          mutationObserver.disconnect();
          mutationObserver = null;
        }
      });
      mutationObserver.observe(document.body, { childList: true });
    }

    return () => {
      styleEl?.remove();
      document.removeEventListener('nitroAds.anchorVisibility', handleAnchorVisibility);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      setHeight(0);
    };
  }, [theme]);

  return null;
};
