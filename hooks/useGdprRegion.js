import { useEffect, useState } from 'react';

export const getConsentObject = (granted) => ({
  ad_storage: granted ? 'granted' : 'denied',
  analytics_storage: granted ? 'granted' : 'denied',
  ad_user_data: granted ? 'granted' : 'denied',
  ad_personalisation: granted ? 'granted' : 'denied'
});

const useGdprRegion = () => {
  const [isGdprRegion, setIsGdprRegion] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNitroLoaded = () => {
      const gdprApplies = !!window.__tcfapi;
      setIsGdprRegion(gdprApplies);
      if (gdprApplies) {
        window.__tcfapi('addEventListener', 2, (tcData, success) => {
          if (success && (tcData.eventStatus === 'tcloaded' || tcData.eventStatus === 'useractioncomplete')) {
            const analyticsGranted = !!tcData.purpose?.consents?.[1];
            window.gtag?.('consent', 'update', getConsentObject(analyticsGranted));
          }
        });
      }
    };

    if (window.nitroAds?.loaded) {
      handleNitroLoaded();
    } else {
      document.addEventListener('nitroAds.loaded', handleNitroLoaded);
      return () => document.removeEventListener('nitroAds.loaded', handleNitroLoaded);
    }
  }, []);

  return isGdprRegion;
};

export default useGdprRegion;
