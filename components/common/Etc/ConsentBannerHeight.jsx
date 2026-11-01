import { useEffect, useRef } from 'react';

// The consent banner (fixed at the bottom, z 9999999) covers a phone sheet's last rows and actions until it is
// answered. Its height, 0 once it is gone, is published as --consent-banner-height, as NitroAdUnits does for the
// anchor ad, so OverlaySheet and the sign-in flows keep what they hold above it.
const ConsentBannerHeight = ({ children }) => {
  const ref = useRef(null);

  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) return undefined;
    const root = document.documentElement;
    let observed = null;
    const publish = () => {
      const height = observed ? Math.round(observed.getBoundingClientRect().height) : 0;
      root.style.setProperty('--consent-banner-height', `${height}px`);
    };
    const resize = new ResizeObserver(publish);
    // The banner mounts after hydration and unmounts on an answer, so the wrapper is watched for it.
    const watch = () => {
      const bar = wrapper.querySelector('.CookieConsent');
      if (bar !== observed) {
        if (observed) resize.unobserve(observed);
        if (bar) resize.observe(bar);
        observed = bar;
      }
      publish();
    };
    const mutations = new MutationObserver(watch);
    mutations.observe(wrapper, { childList: true, subtree: true });
    watch();
    return () => {
      mutations.disconnect();
      resize.disconnect();
      root.style.setProperty('--consent-banner-height', '0px');
    };
  }, []);

  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
};

export default ConsentBannerHeight;
