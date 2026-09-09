import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CacheProvider, ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '../polyfills';
import createEmotionCache from '../utility/createEmotionCache';
import darkTheme from '../styles/theme/darkTheme';
import '../styles/globals.css';
import Head from 'next/head';
import AppProvider from '../components/common/context/AppProvider';
import PreferencesProvider from '../components/common/context/PreferencesProvider';
import { NextSeo } from 'next-seo';
import NavBar from '../components/common/NavBar';
import DataLoadingWrapper from '../components/common/DataLoadingWrapper';
import ConsentScripts from '@components/common/Etc/ContentScripts';
import { CookieConsent } from 'react-cookie-consent';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';
import Button from '@mui/material/Button';
import useGdprRegion, { getConsentObject } from '../hooks/useGdprRegion';
import DynamicBreadcrumbs from '@components/common/DynamicBreadcrumbs';
import RouteProgress from '@components/common/RouteProgress';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PAGE_SEO } from '../data/page-seo';
import { resolveSeoHead } from '../utility/seo-head.mjs';
import { trackPageView } from '../utility/analytics';
import { reportWebVitals } from '../utility/web-vitals';

const clientSideEmotionCache = createEmotionCache();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

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
  const router = useRouter();
  const { asPath, pathname } = router;
  // Pages generated from a dynamic route share one PAGE_SEO entry, so they carry their own
  // noindex through static props - a class page with no builds yet must stay out of the index.
  const pageSeo = PAGE_SEO[pathname];
  const noindex = pageProps?.seoNoindex ?? pageSeo?.noindex;
  const canonicalUrl = `https://idleontoolbox.com${asPath.split('?')[0].split('#')[0]}`;
  const isGdprRegion = useGdprRegion();
  const { title: staticTitle, description: staticDescription } = resolveSeoHead({ pageProps, pageSeo });

  // GA's own history-change measurement reads document.title before next/head has swapped it, so
  // every client-side navigation used to be reported under the previous page's title. Sending the
  // hit here instead - including the first one, since send_page_view is off - keeps them aligned.
  useEffect(() => {
    trackPageView(router.asPath);
    const handleRouteChange = (url) => trackPageView(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
    // asPath is deliberately absent: the listener covers every later navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.events]);

  // Once per page load, not per route change: LCP, CLS and TTFB all describe the initial navigation,
  // which is also what CrUX reports to Search Console. reportWebVitals is idempotent either way.
  useEffect(() => {
    reportWebVitals();
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0"/>
        {/* Title, description and canonical are declared here as well as in each page's
            <NextSeo>: a data page renders DataLoadingWrapper's loader at build time, so its
            NextSeo never runs during the export, and during hydration the title used to blank
            for a second before NextSeo restored it. next/head dedupes the two copies by key, and
            NextSeo's wins once it renders.

            The description has to live in next/head rather than _document: a tag _document
            writes is outside next/head's control, so it cannot be deduped against NextSeo's
            copy - every page carried two, and _document's froze at the landing page and went
            stale on every client-side navigation after it. */}
        {staticTitle ? <title>{staticTitle}</title> : null}
        {/* key must stay "description", for the same reason as the canonical below: next-seo emits
            its own copy under that key, and next/head only collapses two tags when their keys
            match. Without it every page with its own NextSeo ships two descriptions. */}
        {staticDescription ? <meta name="description" content={staticDescription} key="description"/> : null}
        {/* key must stay "canonical": next-seo emits its own tag under that key, and next/head
            only collapses two <link>s when their keys match. Without it the page ends up with
            two canonicals. */}
        {noindex ? null : <link rel="canonical" href={canonicalUrl} key="canonical"/>}
        {/* googlebot only. The app-level <NextSeo> below writes a robots tag on every page, from
            the same `noindex`, and next/head keeps whichever of two <meta name="robots"> renders
            last - so a copy here would be redundant at best. next-seo never writes googlebot. */}
        <meta name="googlebot" content={noindex ? 'noindex,follow' : 'index,follow'}/>
        {preConnections?.map((link) => <link key={link} rel="preconnect" href={link}/>)}
      </Head>
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
      {/* Plain script rather than next/script: afterInteractive injects post-hydration,
          which keeps structured data out of the static export entirely. */}
      <script
        id="schema-structured-data"
        type="application/ld+json"
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
      {/* No WebSite/SearchAction block here on purpose. Google retired the sitelinks search box in
          2024, so the SearchAction bought nothing - and its urlTemplate was the only reason
          Googlebot ever fetched /tools/item-database?q=%7Bsearch_term_string%7D, which it then
          reported as a crawled-not-indexed URL. */}
      <QueryClientProvider client={queryClient}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={darkTheme}>
          <EmotionThemeProvider theme={darkTheme}>
            <CookiePolicyDialog open={openPolicy} onClose={() => setOpenPolicy(false)}/>
            <CssBaseline/>
            <RouteProgress/>
            {/* Outer net for the shell itself (providers, NavBar). Still beats a blank root. */}
            <ErrorBoundary resetKey={asPath} title={'The app failed to load'}>
            <PreferencesProvider>
            <AppProvider>
              <NavBar>
                {/* The app-level SEO defaults. No title/description here on purpose: next-seo
                    re-emits this head after the page's NextSeo on every client route change, so
                    any title or description set here overwrites the page's own. 105 of 108 pages
                    define their own NextSeo; the rest set one locally.

                    <NextSeo> rather than <DefaultSeo>, for one reason: DefaultSeo has no
                    `noindex` prop (it destructures a fixed list that omits noindex/nofollow, so
                    the prop is accepted and silently dropped), and its only way to say noindex is
                    dangerouslySetAllPagesToNoIndex - which writes true into a module-level object
                    next-seo never resets. `next build` renders thousands of pages per worker
                    process, so the first noindex page turned every page rendered after it in that
                    worker into noindex,follow. NextSeo takes noindex per render and mutates
                    nothing; underneath, both render the same buildTags output into next/head. */}
                <NextSeo
                  // next-seo emits a robots tag whether or not one is asked for, so this and the
                  // page's own NextSeo are two writers of one tag and next/head keeps whichever
                  // renders last. Passing the page's own noindex here makes them agree; a bare
                  // NextSeo here would assert "index,follow" and could un-noindex a page that
                  // shipped noindex statically. nofollow is deliberately left alone: these pages
                  // want "noindex,follow" so crawlers still traverse their links.
                  noindex={Boolean(noindex)}
                  // Same condition as the <link> in _app's <Head> above, or a noindex page ships
                  // no canonical and then grows one on hydration - including the 404, which
                  // would claim a canonical for whatever URL failed to resolve.
                  canonical={noindex ? undefined : canonicalUrl}
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
                {/* Contains a page-level crash to this slot. Without it React unmounts the whole
                    root and the app goes blank until a manual refresh. */}
                <ErrorBoundary resetKey={asPath} title={'This page failed to render'}>
                  <DataLoadingWrapper>
                    <Component {...pageProps} />
                  </DataLoadingWrapper>
                </ErrorBoundary>
              </NavBar>
            </AppProvider>
            </PreferencesProvider>
            </ErrorBoundary>
          </EmotionThemeProvider>
        </ThemeProvider>
      </CacheProvider>
      </QueryClientProvider>
    </>
  );
};

export default MyApp;
