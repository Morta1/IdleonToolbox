import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@mui/material';

// Set to false to revert z-index overrides (e.g. if NitroPay ToS requires it)
const OVERRIDE_NITRO_ZINDEX = true;

const NITRO_BASE_OPTIONS = {
  refreshTime: 30,
  refreshVisibleOnly: true
}

const createRail = (id, alignment, sizes, mediaQuery) => {
  if (!window.nitroAds) return;

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
};

const destroyRail = (id) => {
  // Rail ads are wrapped in a body > div created by NitroAds — remove the wrapper to fully clean up
  const wrapper = document.querySelector(`body > div:has(#${id})`);
  if (wrapper) {
    wrapper.remove();
    return;
  }
  // No wrapper yet means the ads script hasn't built its container, so the only node with this id
  // is the one React rendered. Removing that leaves React holding a node it no longer owns, which
  // throws NotFoundError on unmount — never touch anything inside the app root.
  const el = document.getElementById(id);
  if (el && !document.getElementById('__next')?.contains(el)) el.remove();
};

export const NitroRailAd = ({
                              id,
                              alignment,
                              sizes,
                              mediaQuery = '(min-width: 850px)',
                              style,
                              teardownOnNavigate = false
                            }) => {
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    const styleEl = OVERRIDE_NITRO_ZINDEX ? document.createElement('style') : null;
    if (styleEl) {
      styleEl.textContent = `body > div:has(#${id}) { z-index: ${theme.zIndex.appBar - 1} !important; }`;
      document.head.appendChild(styleEl);
    }

    createRail(id, alignment, sizes, mediaQuery);

    return () => {
      styleEl?.remove();
      destroyRail(id);
    };
  }, [id, alignment, sizes, mediaQuery, theme]);

  // Route-scoped rails have to be gone before Next commits the new URL. NitroAds polls
  // location.href every 100ms and calls onNavigate() on every unit whose element it still finds,
  // which for a rail is a full refresh. That render resolves after React's unmount cleanup, builds
  // a fresh container in body and arms a new refresh timer nothing will ever clear — so the ad
  // returns one refreshTime later, on top of whichever page the user is on now.
  useEffect(() => {
    if (!teardownOnNavigate) return;

    const handleStart = (url) => {
      // Query-only changes keep the placement mounted; tearing it down and rebuilding it on every
      // one of those is pure ad-request churn.
      if (new URL(url, window.location.origin).pathname === router.pathname) return;
      destroyRail(id);
    };
    // Only reached when a navigation that already tore the ad down never left the page.
    const handleError = () => createRail(id, alignment, sizes, mediaQuery);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeError', handleError);
    };
  }, [teardownOnNavigate, id, alignment, sizes, mediaQuery, router]);

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
