import React from 'react';
import Script from 'next/script';
import { getCookieConsentValue } from 'react-cookie-consent';

export default function ConsentScripts() {
  return (
    <>
      {/* Google Analytics */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-YER8JY07QK"
      />
      <Script id="ga-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
      
          // Set default consent (before user interaction)
        `}
        {getCookieConsentValue('idleon-consent') === 'true' ? `
          gtag('consent', 'default', {
            ad_storage: 'granted',
            analytics_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalisation: 'granted'
          });
        ` : `
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalisation: 'denied'
          });
        `}
        {`
          gtag('js', new Date());
          gtag('config', 'G-YER8JY07QK');
        `}
      </Script>
      {/* Google Ads */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1842647313167572"
        id="ads-by-google"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
    </>
  );
}
