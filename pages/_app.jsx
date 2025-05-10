import React, { useState } from 'react';
import { CacheProvider, ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '../polyfills';
import createEmotionCache from '../utility/createEmotionCache';
import darkTheme from '../styles/theme/darkTheme';
import '../styles/globals.css';
import Head from 'next/head';
import Script from 'next/script'
import AppProvider from '../components/common/context/AppProvider';
import WaitForRouter from '../components/common/WaitForRouter';
import { DefaultSeo } from 'next-seo';
import NavBar from '../components/common/NavBar';
import DataLoadingWrapper from '../components/common/DataLoadingWrapper';
import ConsentScripts from '@components/common/Etc/ContentScripts';
import { CookieConsent } from 'react-cookie-consent';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';
import Button from '@mui/material/Button';

const clientSideEmotionCache = createEmotionCache();
// remove overlay of error in dev mode.
const noOverlayWorkaroundScript = `
  window.addEventListener('error', event => {
    event.stopImmediatePropagation()
  })

  window.addEventListener('unhandledrejection', event => {
    event.stopImmediatePropagation()
  })
`;

const preConnections = ['https://firestore.googleapis.com', 'https://tpc.googlesyndication.com',
  'https://partner.googleadservices.com', 'https://pagead2.googlesyndication.com',
  'https://identitytoolkit.googleapis.com', 'https://googleads.g.doubleclick.net', 'https://www.google-analytics.com',
  'https://adservice.google.co.il', 'https://www.googletagmanager.com', 'https://adservice.google.com']

const MyApp = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const [openPolicy, setOpenPolicy] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  const getConsentObject = (granted) => {
    return {
      ad_storage: granted ? 'granted' : 'denied',
      analytics_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalisation: granted ? 'granted' : 'denied'
    }
  }
  return (
    <>
      <Head>
        <title>Idleon Toolbox</title>
        <meta
          name="description"
          content="Power up your Legends of Idleon adventure with Idleon Toolbox's essential tools and resources for optimizing gameplay, character builds, crafting, and more."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0"/>
        <meta name="googlebot" content="index,follow"/>
        {preConnections?.map((link) => <link key={link} rel="preconnect" href={link}/>)}
      </Head>
      {process.env.NODE_ENV !== 'production' &&
        <Script id={'remove-error-layout'} dangerouslySetInnerHTML={{ __html: noOverlayWorkaroundScript }}/>}
      <CookieConsent
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
          }
        }}
        onDecline={() => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', getConsentObject(false));
          }
        }}
      >
        We use cookies to enhance your experience, analyze traffic, and personalize ads. You can accept or decline these
        cookies.{' '}
        <Button variant={'contained'} sx={{ height: 24, px: 1, fontSize: 12, textTransform: 'none' }}
                onClick={() => setOpenPolicy(true)}>Learn
          more</Button>
      </CookieConsent>
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
            'url': 'https://www.idleontoolbox.com',
            'description': 'Power up your Legends of Idleon adventure with Idleon Toolbox\'s essential tools and resources for optimizing gameplay, character builds, crafting, and more.',
            'applicationCategory': 'GameUtility',
            'operatingSystem': 'All',
            'author': {
              '@type': 'Organization',
              'name': 'Idleon Toolbox',
              'url': 'https://www.idleontoolbox.com'
            },
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            }
          })
        }}
      />
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
                    canonical="https://www.idleontoolbox.com/"
                    openGraph={{
                      type: 'website',
                      locale: 'en_US',
                      url: 'https://www.idleontoolbox.com/',
                      siteName: 'Idleon Toolbox',
                      title: 'Idleon Toolbox - Essential Tools for Legends of Idleon',
                      description: 'Power up your Legends of Idleon adventure with Idleon Toolbox\'s essential tools and resources for optimizing gameplay, character builds, crafting, and more.',
                      images: [
                        {
                          url: 'https://idleontoolbox.com/data/Coins5.png',
                          width: 21,
                          height: 21,
                          alt: 'Idleon Toolbox'
                        }
                      ]
                    }}
                    twitter={{
                      handle: '@IdleonToolbox',
                      site: '@IdleonToolbox',
                      cardType: 'summary_large_image'
                    }}
                    additionalMetaTags={[
                      {
                        name: 'keywords',
                        content: 'Idleon, Legends of Idleon, Idleon Toolbox, Idleon calculator, Idleon builds, Idleon guide, idle game tools'
                      },
                      {
                        property: 'og:image', // Explicitly add og:image
                        content: 'https://idleontoolbox.com/data/Coins5.png'
                      }
                    ]}
                  />
                  <DataLoadingWrapper>
                    <Component {...pageProps} />
                  </DataLoadingWrapper>
                </NavBar>
              </AppProvider>
            </WaitForRouter>
          </EmotionThemeProvider>
        </ThemeProvider>
      </CacheProvider>
    </>
  );
};

export default MyApp;
