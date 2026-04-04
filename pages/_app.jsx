import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { CacheProvider, ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '../polyfills';
import createEmotionCache from '../utility/createEmotionCache';
import darkTheme from '../styles/theme/darkTheme';
import '../styles/globals.css';
import Head from 'next/head';
import Script from 'next/script';
import AppProvider from '../components/common/context/AppProvider';
import WaitForRouter from '../components/common/WaitForRouter';
import { DefaultSeo } from 'next-seo';
import NavBar from '../components/common/NavBar';
import DataLoadingWrapper from '../components/common/DataLoadingWrapper';
import ConsentScripts from '@components/common/Etc/ContentScripts';
import { CookieConsent } from 'react-cookie-consent';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';
import Button from '@mui/material/Button';
import useGdprRegion, { getConsentObject } from '../hooks/useGdprRegion';
import DynamicBreadcrumbs from '@components/common/DynamicBreadcrumbs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const clientSideEmotionCache = createEmotionCache();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

const noOverlayWorkaroundScript = `
  window.addEventListener('error', event => {
    event.stopImmediatePropagation()
  })

  window.addEventListener('unhandledrejection', event => {
    event.stopImmediatePropagation()
  })
`;

const preConnections = [
  'https://firestore.googleapis.com',
  'https://tpc.googlesyndication.com',
  'https://partner.googleadservices.com',
  'https://pagead2.googlesyndication.com',
  'https://identitytoolkit.googleapis.com',
  'https://googleads.g.doubleclick.net',
  'https://www.google-analytics.com',
  'https://adservice.google.co.il',
  'https://www.googletagmanager.com',
  'https://adservice.google.com',
  'https://s.nitropay.com'
];

const MyApp = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const [openPolicy, setOpenPolicy] = useState(false);
  const { asPath } = useRouter();
  const canonicalUrl = `https://idleontoolbox.com${asPath.split('?')[0].split('#')[0]}`;
  const isGdprRegion = useGdprRegion();

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0"/>
        <meta name="googlebot" content="index,follow"/>
        {preConnections?.map((link) => <link key={link} rel="preconnect" href={link}/>)}
      </Head>
      {process.env.NODE_ENV !== 'production' &&
        <Script id={'remove-error-layout'} dangerouslySetInnerHTML={{ __html: noOverlayWorkaroundScript }}/>}
      <div id="ncmp-consent-link"></div>
      {isGdprRegion === false && <CookieConsent
        buttonText="Accept"
        declineButtonText="Decline"
        enableDeclineButton
        cookieName="idleon-consent"
        style={{ zIndex: 9999999, display: 'flex', alignItems: 'center', fontSize: 14 }}
        contentStyle={{ margin: '8px 15px' }}
        buttonStyle={{
          margin: '0 15px 0 0',
          borderRadius: '8px',
          fontSize: 12,
          backgroundColor: '#1976d2',
          color: 'white'
        }}
        declineButtonStyle={{ margin: '0 15px 0 15px', borderRadius: '8px', fontSize: 12 }}
        onAccept={() => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', getConsentObject(true));
            window.gtag('event', 'consent_choice', { event_category: 'engagement', event_label: 'accept', value: 1 });
          }
        }}
        onDecline={() => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', getConsentObject(false));
            window.gtag('event', 'consent_choice', { event_category: 'engagement', event_label: 'decline', value: 1 });
          }
        }}
      >
        We use cookies to enhance your experience, analyze traffic, and personalize ads. You can accept or decline these
        cookies.{' '}
        <Button variant={'contained'} sx={{ height: 24, px: 1, fontSize: 12, textTransform: 'none' }}
                onClick={() => setOpenPolicy(true)}>Learn
          more</Button>
      </CookieConsent>}
      <ConsentScripts/>
      <Script
        id="schema-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            'name': 'Idleon Toolbox',
            'url': 'https://idleontoolbox.com',
            'description': 'Power up your Legends of Idleon adventure with Idleon Toolbox\'s essential tools and resources for optimizing gameplay, character builds, crafting, and more.',
            'applicationCategory': 'GameUtility',
            'operatingSystem': 'All',
            'author': {
              '@type': 'Organization',
              'name': 'Idleon Toolbox',
              'url': 'https://idleontoolbox.com'
            },
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            }
          })
        }}
      />
      <Script
        id="schema-website"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': 'Idleon Toolbox',
            'url': 'https://idleontoolbox.com',
            'potentialAction': {
              '@type': 'SearchAction',
              'target': {
                '@type': 'EntryPoint',
                'urlTemplate': 'https://idleontoolbox.com/tools/item-database?q={search_term_string}'
              },
              'query-input': 'required name=search_term_string'
            }
          })
        }}
      />
      <QueryClientProvider client={queryClient}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={darkTheme}>
          <EmotionThemeProvider theme={darkTheme}>
            <CookiePolicyDialog open={openPolicy} onClose={() => setOpenPolicy(false)}/>
            <CssBaseline/>
            <WaitForRouter>
              <AppProvider>
                <NavBar>
                  <DefaultSeo
                    title="Idleon Toolbox - Essential Tools for Legends of Idleon"
                    description="Power up your Legends of Idleon adventure with Idleon Toolbox's essential tools and resources for optimizing gameplay, character builds, crafting, and more."
                    canonical={canonicalUrl}
                    openGraph={{
                      type: 'website',
                      locale: 'en_US',
                      url: canonicalUrl,
                      siteName: 'Idleon Toolbox',
                      title: 'Idleon Toolbox - Essential Tools for Legends of Idleon',
                      description: 'Power up your Legends of Idleon adventure with Idleon Toolbox\'s essential tools and resources for optimizing gameplay, character builds, crafting, and more.',
                      images: [
                        {
                          url: 'https://idleontoolbox.com/data/Coins5.png',
                          alt: 'Idleon Toolbox'
                        }
                      ]
                    }}
                    twitter={{
                      handle: '@IdleonToolbox',
                      site: '@IdleonToolbox',
                      cardType: 'summary'
                    }}
                    additionalMetaTags={[
                      {
                        name: 'keywords',
                        content: 'Idleon, Legends of Idleon, Idleon Toolbox, Idleon calculator, Idleon builds, Idleon guide, idle game tools'
                      }
                    ]}
                  />
                  <DynamicBreadcrumbs/>
                  <DataLoadingWrapper>
                    <Component {...pageProps} />
                  </DataLoadingWrapper>
                </NavBar>
              </AppProvider>
            </WaitForRouter>
          </EmotionThemeProvider>
        </ThemeProvider>
      </CacheProvider>
      </QueryClientProvider>
    </>
  );
};

export default MyApp;
