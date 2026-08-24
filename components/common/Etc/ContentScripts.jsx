import React from 'react';
import Script from 'next/script';
import { getCookieConsentValue } from 'react-cookie-consent';
import { isProd } from '@utility/helpers';
import { AD_PROVIDER, AD_PROVIDERS } from '@components/common/Ads/AdUnit';

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
            ad_personalization: 'granted'
          });
        ` : `
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
        `}
        {`
          gtag('js', new Date());
          // send_page_view is off because this is a client-routed app: page_view is sent from
          // _app once the new title is on the document. See utility/analytics.js.
          gtag('config', 'G-YER8JY07QK', { send_page_view: false });
        `}
      </Script>
      {/* Ad Scripts */}
      {AD_PROVIDER === AD_PROVIDERS.NITRO ? (
        <>
          <Script id="nitro-init" data-cfasync="false">
            {`window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(["createAd",arguments,e])})},addUserToken:function(){window.nitroAds.queue.push(["addUserToken",arguments])},queue:[]};`}
          </Script>
<Script
            id="nitro-ads-script"
            strategy="afterInteractive"
            data-cfasync="false"
            data-spa="auto"
            data-log-level={isProd ? 'info': 'silent'}
            async
            src="https://s.nitropay.com/ads-2330.js"
          />
        </>
      ) : (
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1842647313167572"
          id="ads-by-google"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
