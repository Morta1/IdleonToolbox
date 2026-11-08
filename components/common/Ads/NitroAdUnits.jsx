import { useEffect } from 'react';
import { useTheme } from '@mui/material';

// Set to false to revert z-index overrides (e.g. if NitroPay ToS requires it)
const OVERRIDE_NITRO_ZINDEX = true;

const NITRO_BASE_OPTIONS = {
  refreshTime: 30,
  refreshVisibleOnly: true
}
const REPORT = { enabled: true, icon: true, wording: 'Report Ad', position: 'top-right' };

const destroyUnit = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  // Removes a side ad's display holder if Nitro ever moved it into body. Anything still inside the app root belongs to
  // React: with the ads script blocked (Firefox ETP, any ad blocker) window.nitroAds never exists and the div is never
  // moved. It has to be left alone: removing it leaves React holding a node it no longer owns, which throws
  // NotFoundError on unmount. Matching on `body > div:has(#id)` once matched #__next itself in exactly this case and
  // deleted the whole app root, blanking the page until a manual refresh.
  if (document.getElementById('__next')?.contains(el)) return;
  // Moved: Nitro wraps a relocated unit in a body > div. Remove the wrapper, or the bare node without one.
  (el.closest('body > div') || el).remove();
};

const HOLDER_STYLE = { width: '100%', height: '100%' };

// A display unit in a box the frame owns (the side ads, AdUnit.jsx SideAds). Display is Nitro's default format: it
// renders in its holder where the holder stands (only rails, anchors and the other holder-less formats build their own
// node in body), and it takes only the sizes that fit the holder, so the holder fills the box and the box sets the
// height (frame.js adBoxSx). The outer div is React's own: if Nitro ever moved the holder, React would still remove
// a node it owns, and destroyUnit removes the moved holder (one still in the app is left to React). No z-index tag:
// the unit sits in the page's flow, under the bar, the band and every overlay.
export const NitroSideAd = ({ id, sizes, side }) => {
  useEffect(() => {
    window.nitroAds?.createAd(id, { ...NITRO_BASE_OPTIONS, sizes, report: REPORT });
    return () => destroyUnit(id);
  }, [id, sizes]);

  // A narrower creative (160x600) sits against the page: at the left box's right edge, at the right box's left edge.
  // colorScheme light: an unfilled ad's empty iframe otherwise paints opaque white on the dark page.
  return <div style={HOLDER_STYLE}>
    <div id={id} style={{
      ...HOLDER_STYLE, display: 'flex', justifyContent: side === 'left' ? 'flex-end' : 'flex-start', colorScheme: 'light'
    }}/>
  </div>;
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
